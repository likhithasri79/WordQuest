import { eq, and, sql, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { matches, rounds, players, Match, Round } from '../../db/schema.js';
import { resolveRound } from '../../domain/stateMachine.js';
import { validateWordInput } from '../../domain/wordNormalizer.js';
import { isStudyPeriodExpired } from '../../domain/studyTimer.js';
import { AppError } from '../../middleware/errorHandler.js';
import { RoundResolutionResult } from '../../domain/types.js';

export interface SubmitWordParams {
  matchId: string;
  playerId: string;
  roundNumber: number;
  word: string;
}

export type SubmitWordResponse =
  | {
      resolved: false;
      matchId: string;
      roundNumber: number;
      submittingPlayerId: string;
    }
  | {
      resolved: true;
      matchId: string;
      roundNumber: number;
      result: RoundResolutionResult;
    };

export interface SafeMatchView {
  matchId: string;
  status: Match['status'];
  currentRound: number;
  mismatchCount: number;
  studyEndsAt: Date | null;
  serverTime: string;
  myRole: 'playerA' | 'playerB';
  mySubmissionStatus: 'PENDING' | 'SUBMITTED';
  opponentSubmissionStatus: 'PENDING' | 'SUBMITTED';
  opponent: {
    id: string;
    nickname: string;
    avatarId: string;
  };
  resolvedHistory: Array<{
    roundNumber: number;
    yourWord: string;
    opponentWord: string;
    isMatch: boolean;
    resolvedAt: Date | null;
  }>;
}

/**
 * Creates a brand new match between two paired players atomically.
 */
export async function createMatch(playerAId: string, playerBId: string): Promise<Match> {
  if (playerAId === playerBId) {
    throw new AppError('Cannot create a match with identical players', 400, 'SELF_MATCH_FORBIDDEN');
  }

  return await db.transaction(async (tx) => {
    // 1. Insert Match record
    const [newMatch] = await tx
      .insert(matches)
      .values({
        playerAId,
        playerBId,
        status: 'AWAITING_SUBMISSIONS',
        currentRound: 1,
        mismatchCount: 0,
      })
      .returning();

    // 2. Initialize Round 1
    await tx.insert(rounds).values({
      matchId: newMatch.id,
      roundNumber: 1,
    });

    return newMatch;
  });
}

/**
 * Submits a word for a round under strict ACID transaction and row-level locking.
 * Enforces Zero Word Leakage, idempotency, and exact-once resolution.
 */
export async function submitWord({
  matchId,
  playerId,
  roundNumber,
  word,
}: SubmitWordParams): Promise<SubmitWordResponse> {
  const validation = validateWordInput(word);
  if (!validation.valid || !validation.sanitized) {
    throw new AppError(validation.error || 'Invalid word submission', 400, 'INVALID_SUBMISSION');
  }
  const sanitizedWord = validation.sanitized;

  return await db.transaction(async (tx) => {
    // 1. Lock the match record for update to prevent race conditions
    const [match] = await tx
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .for('update');

    if (!match) {
      throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
    }

    // Verify player is part of this match
    const isPlayerA = match.playerAId === playerId;
    const isPlayerB = match.playerBId === playerId;
    if (!isPlayerA && !isPlayerB) {
      throw new AppError('You are not authorized for this match', 403, 'UNAUTHORIZED');
    }

    if (match.status === 'COMPLETED') {
      throw new AppError('Match is already completed', 400, 'MATCH_COMPLETED');
    }

    // Check if match is currently in study session
    if (match.status === 'STUDYING') {
      const now = new Date();
      if (!isStudyPeriodExpired(match.studyEndsAt, now)) {
        throw new AppError(
          'Active study session is in progress. Round is not yet open.',
          400,
          'PREMATURE_SUBMISSION'
        );
      }
      // Study has expired: safely transition to AWAITING_SUBMISSIONS for currentRound
      await tx
        .update(matches)
        .set({
          status: 'AWAITING_SUBMISSIONS',
          studyEndsAt: null,
          updatedAt: now,
        })
        .where(eq(matches.id, matchId));
    }

    if (roundNumber !== match.currentRound) {
      throw new AppError(
        `Submission is for round ${roundNumber}, but active round is ${match.currentRound}`,
        400,
        'INVALID_ROUND_NUMBER'
      );
    }

    // 2. Lock the current round record
    const [round] = await tx
      .select()
      .from(rounds)
      .where(and(eq(rounds.matchId, matchId), eq(rounds.roundNumber, roundNumber)))
      .for('update');

    if (!round) {
      throw new AppError('Round record not found', 404, 'ROUND_NOT_FOUND');
    }

    // Check for duplicate submission by this player
    if ((isPlayerA && round.playerAWord !== null) || (isPlayerB && round.playerBWord !== null)) {
      throw new AppError('Word already submitted for this round', 409, 'DUPLICATE_SUBMISSION');
    }

    const now = new Date();
    const updatedAWord = isPlayerA ? sanitizedWord : round.playerAWord;
    const updatedASubmittedAt = isPlayerA ? now : round.playerASubmittedAt;

    const updatedBWord = isPlayerB ? sanitizedWord : round.playerBWord;
    const updatedBSubmittedAt = isPlayerB ? now : round.playerBSubmittedAt;

    // Check if both words are now present
    const bothSubmitted = updatedAWord !== null && updatedBWord !== null;

    if (!bothSubmitted) {
      // Only 1 player has submitted so far: persist and hold secretly
      await tx
        .update(rounds)
        .set({
          playerAWord: updatedAWord,
          playerASubmittedAt: updatedASubmittedAt,
          playerBWord: updatedBWord,
          playerBSubmittedAt: updatedBSubmittedAt,
        })
        .where(eq(rounds.id, round.id));

      return {
        resolved: false,
        matchId,
        roundNumber,
        submittingPlayerId: playerId,
      };
    }

    // Both players have submitted! Resolve the round atomically
    const resolution = resolveRound({
      roundNumber,
      wordA: updatedAWord,
      wordB: updatedBWord,
      currentMismatchCount: match.mismatchCount,
      currentTime: now,
    });

    if (resolution.isMatch) {
      // Victory: update match to COMPLETED
      await tx
        .update(matches)
        .set({
          status: 'COMPLETED',
          winnerWord: updatedAWord,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(matches.id, matchId));

      await tx
        .update(rounds)
        .set({
          playerAWord: updatedAWord,
          playerASubmittedAt: updatedASubmittedAt,
          playerBWord: updatedBWord,
          playerBSubmittedAt: updatedBSubmittedAt,
          isMatch: true,
          resolvedAt: now,
        })
        .where(eq(rounds.id, round.id));
    } else {
      // Mismatch: update match to STUDYING and increment mismatch count
      await tx
        .update(matches)
        .set({
          status: 'STUDYING',
          mismatchCount: resolution.mismatchCount,
          studyEndsAt: resolution.studyEndsAt,
          updatedAt: now,
        })
        .where(eq(matches.id, matchId));

      await tx
        .update(rounds)
        .set({
          playerAWord: updatedAWord,
          playerASubmittedAt: updatedASubmittedAt,
          playerBWord: updatedBWord,
          playerBSubmittedAt: updatedBSubmittedAt,
          isMatch: false,
          resolvedAt: now,
        })
        .where(eq(rounds.id, round.id));

      // Pre-seed the next round record for when the study period ends
      await tx.insert(rounds).values({
        matchId,
        roundNumber: roundNumber + 1,
      });

      await tx
        .update(matches)
        .set({ currentRound: roundNumber + 1 })
        .where(eq(matches.id, matchId));
    }

    return {
      resolved: true,
      matchId,
      roundNumber,
      result: resolution,
    };
  });
}

/**
 * Retrieves authoritative match state customized for a specific authenticated player.
 * Strictly enforces Zero Word Leakage for any pending, unresolved words.
 */
export async function getSafeMatchView(matchId: string, playerId: string): Promise<SafeMatchView> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

  if (!match) {
    throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
  }

  const isPlayerA = match.playerAId === playerId;
  const isPlayerB = match.playerBId === playerId;
  if (!isPlayerA && !isPlayerB) {
    throw new AppError('Unauthorized access to match', 403, 'UNAUTHORIZED');
  }

  const opponentId = isPlayerA ? match.playerBId : match.playerAId;
  const [opponent] = await db
    .select({
      id: players.id,
      nickname: players.nickname,
      avatarId: players.avatarId,
    })
    .from(players)
    .where(eq(players.id, opponentId))
    .limit(1);

  // Fetch all rounds for this match ordered chronologically
  const matchRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.matchId, matchId))
    .orderBy(asc(rounds.roundNumber));

  const currentRoundRecord = matchRounds.find((r) => r.roundNumber === match.currentRound);

  const mySubmissionStatus = currentRoundRecord
    ? (isPlayerA ? currentRoundRecord.playerAWord : currentRoundRecord.playerBWord) !== null
      ? 'SUBMITTED'
      : 'PENDING'
    : 'PENDING';

  const opponentSubmissionStatus = currentRoundRecord
    ? (isPlayerA ? currentRoundRecord.playerBWord : currentRoundRecord.playerAWord) !== null
      ? 'SUBMITTED'
      : 'PENDING'
    : 'PENDING';

  // Build resolved history (only resolved rounds are visible)
  const resolvedHistory = matchRounds
    .filter((r) => r.resolvedAt !== null && r.isMatch !== null)
    .map((r) => ({
      roundNumber: r.roundNumber,
      yourWord: isPlayerA ? r.playerAWord || '' : r.playerBWord || '',
      opponentWord: isPlayerA ? r.playerBWord || '' : r.playerAWord || '',
      isMatch: Boolean(r.isMatch),
      resolvedAt: r.resolvedAt,
    }));

  return {
    matchId: match.id,
    status: match.status,
    currentRound: match.currentRound,
    mismatchCount: match.mismatchCount,
    studyEndsAt: match.studyEndsAt,
    serverTime: new Date().toISOString(),
    myRole: isPlayerA ? 'playerA' : 'playerB',
    mySubmissionStatus,
    opponentSubmissionStatus,
    opponent: opponent || { id: opponentId, nickname: 'Opponent', avatarId: 'avatar-01' },
    resolvedHistory,
  };
}
