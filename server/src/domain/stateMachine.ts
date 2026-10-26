import { MatchStatus } from './types.js';
import { normalizeWord, validateWordInput } from './wordNormalizer.js';
import {
  calculateStudyDurationMinutes,
  calculateStudyEndsAt,
} from './studyTimer.js';
import { RoundResolutionResult } from './types.js';

// Explicit state transition table
const VALID_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  WAITING_FOR_PLAYERS: ['AWAITING_SUBMISSIONS', 'CANCELLED'],
  AWAITING_SUBMISSIONS: ['RESOLVING_ROUND', 'CANCELLED'],
  RESOLVING_ROUND: ['COMPLETED', 'STUDYING', 'CANCELLED'],
  STUDYING: ['AWAITING_SUBMISSIONS', 'CANCELLED'],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
};

/**
 * Checks if a proposed match status transition is legal according to the state machine.
 */
export function canTransition(from: MatchStatus, to: MatchStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Asserts that a state transition is legal, throwing an error if invalid.
 */
export function assertValidTransition(from: MatchStatus, to: MatchStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal match state transition from '${from}' to '${to}'.`);
  }
}

export interface ResolveRoundParams {
  roundNumber: number;
  wordA: string;
  wordB: string;
  currentMismatchCount: number;
  currentTime?: Date;
}

/**
 * Resolves a round atomically given both players' raw inputs and current match state.
 * Pure domain function with no database or network dependencies.
 */
export function resolveRound({
  roundNumber,
  wordA,
  wordB,
  currentMismatchCount,
  currentTime = new Date(),
}: ResolveRoundParams): RoundResolutionResult {
  const validationA = validateWordInput(wordA);
  if (!validationA.valid) {
    throw new Error(`Invalid Player A submission: ${validationA.error}`);
  }

  const validationB = validateWordInput(wordB);
  if (!validationB.valid) {
    throw new Error(`Invalid Player B submission: ${validationB.error}`);
  }

  const normalizedA = normalizeWord(wordA);
  const normalizedB = normalizeWord(wordB);
  const isMatch = normalizedA === normalizedB;

  if (isMatch) {
    return {
      isMatch: true,
      roundNumber,
      wordA,
      wordB,
      normalizedA,
      normalizedB,
      nextStatus: 'COMPLETED',
      mismatchCount: currentMismatchCount,
      studyDurationMinutes: null,
      studyEndsAt: null,
    };
  }

  // Mismatch progression
  const newMismatchCount = currentMismatchCount + 1;
  const studyDurationMinutes = calculateStudyDurationMinutes(newMismatchCount);
  const studyEndsAt = calculateStudyEndsAt(newMismatchCount, currentTime);

  return {
    isMatch: false,
    roundNumber,
    wordA,
    wordB,
    normalizedA,
    normalizedB,
    nextStatus: 'STUDYING',
    mismatchCount: newMismatchCount,
    studyDurationMinutes,
    studyEndsAt,
  };
}
