import { describe, it, expect } from 'vitest';
import { createGuestPlayer } from '../../src/modules/players/playerService.js';
import {
  createMatch,
  submitWord,
  getSafeMatchView,
} from '../../src/modules/matches/matchService.js';

describe('Match Service & Zero Word Leakage Integration', () => {
  it('should handle private submission, zero word leakage, and round completion', async () => {
    // 1. Create two test players
    const { player: playerA } = await createGuestPlayer('Alice');
    const { player: playerB } = await createGuestPlayer('Bob');

    // 2. Create match
    const match = await createMatch(playerA.id, playerB.id);
    expect(match.status).toBe('AWAITING_SUBMISSIONS');
    expect(match.currentRound).toBe(1);

    // 3. Player A submits their secret word
    const resA = await submitWord({
      matchId: match.id,
      playerId: playerA.id,
      roundNumber: 1,
      word: '  Cosmos ',
    });

    expect(resA.resolved).toBe(false);
    expect(resA.matchId).toBe(match.id);

    // 4. ZERO WORD LEAKAGE CHECK:
    // Bob inspects the match state. Bob should see that Alice has submitted,
    // but Alice's word MUST NOT be present anywhere in the state view!
    const bobView = await getSafeMatchView(match.id, playerB.id);
    expect(bobView.mySubmissionStatus).toBe('PENDING');
    expect(bobView.opponentSubmissionStatus).toBe('SUBMITTED');
    expect(bobView.resolvedHistory.length).toBe(0); // Round is still open, not in resolved history

    // 5. Duplicate submission check: Alice tries to submit again for Round 1
    await expect(
      submitWord({
        matchId: match.id,
        playerId: playerA.id,
        roundNumber: 1,
        word: 'Galaxy',
      })
    ).rejects.toThrow(/already submitted/);

    // 6. Player B submits the exact matching word
    const resB = await submitWord({
      matchId: match.id,
      playerId: playerB.id,
      roundNumber: 1,
      word: 'cosmos',
    });

    expect(resB.resolved).toBe(true);
    if (resB.resolved) {
      expect(resB.result.isMatch).toBe(true);
      expect(resB.result.nextStatus).toBe('COMPLETED');
    }

    // 7. Inspect final resolved state: now both words are revealed!
    const finalView = await getSafeMatchView(match.id, playerA.id);
    expect(finalView.status).toBe('COMPLETED');
    expect(finalView.resolvedHistory.length).toBe(1);
    expect(finalView.resolvedHistory[0].yourWord).toBe('Cosmos');
    expect(finalView.resolvedHistory[0].opponentWord).toBe('cosmos');
    expect(finalView.resolvedHistory[0].isMatch).toBe(true);
  });

  it('should handle mismatch progression and authoritative study_ends_at', async () => {
    const { player: playerA } = await createGuestPlayer('Charlie');
    const { player: playerB } = await createGuestPlayer('Dana');

    const match = await createMatch(playerA.id, playerB.id);

    // Both submit different words for Round 1
    await submitWord({
      matchId: match.id,
      playerId: playerA.id,
      roundNumber: 1,
      word: 'Sun',
    });

    const resB = await submitWord({
      matchId: match.id,
      playerId: playerB.id,
      roundNumber: 1,
      word: 'Moon',
    });

    expect(resB.resolved).toBe(true);
    if (resB.resolved) {
      expect(resB.result.isMatch).toBe(false);
      expect(resB.result.nextStatus).toBe('STUDYING');
      expect(resB.result.mismatchCount).toBe(1);
      expect(resB.result.studyDurationMinutes).toBe(15);
      expect(resB.result.studyEndsAt).toBeDefined();
    }

    // Inspect match view during study session
    const studyView = await getSafeMatchView(match.id, playerA.id);
    expect(studyView.status).toBe('STUDYING');
    expect(studyView.mismatchCount).toBe(1);
    expect(studyView.studyEndsAt).not.toBeNull();
    // Round 1 is in resolved history
    expect(studyView.resolvedHistory.length).toBe(1);
    expect(studyView.resolvedHistory[0].yourWord).toBe('Sun');
    expect(studyView.resolvedHistory[0].opponentWord).toBe('Moon');
    expect(studyView.resolvedHistory[0].isMatch).toBe(false);

    // Attempting premature submission for Round 2 while studying must fail
    await expect(
      submitWord({
        matchId: match.id,
        playerId: playerA.id,
        roundNumber: 2,
        word: 'Star',
      })
    ).rejects.toThrow(/Active study session is in progress/);
  });
});
