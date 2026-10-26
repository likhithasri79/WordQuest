import { describe, it, expect } from 'vitest';
import {
  canTransition,
  assertValidTransition,
  resolveRound,
} from '../../src/domain/stateMachine.js';

describe('Match State Machine & Round Resolution Domain Logic', () => {
  describe('canTransition & assertValidTransition', () => {
    it('should permit legal transitions along the match lifecycle', () => {
      expect(canTransition('WAITING_FOR_PLAYERS', 'AWAITING_SUBMISSIONS')).toBe(true);
      expect(canTransition('AWAITING_SUBMISSIONS', 'RESOLVING_ROUND')).toBe(true);
      expect(canTransition('RESOLVING_ROUND', 'COMPLETED')).toBe(true);
      expect(canTransition('RESOLVING_ROUND', 'STUDYING')).toBe(true);
      expect(canTransition('STUDYING', 'AWAITING_SUBMISSIONS')).toBe(true);
      expect(canTransition('AWAITING_SUBMISSIONS', 'CANCELLED')).toBe(true);
    });

    it('should reject illegal transitions and backwards jumps', () => {
      expect(canTransition('COMPLETED', 'AWAITING_SUBMISSIONS')).toBe(false);
      expect(canTransition('CANCELLED', 'AWAITING_SUBMISSIONS')).toBe(false);
      expect(canTransition('WAITING_FOR_PLAYERS', 'STUDYING')).toBe(false);
      expect(canTransition('STUDYING', 'COMPLETED')).toBe(false);
    });

    it('should throw Error on invalid transitions with assertValidTransition', () => {
      expect(() => assertValidTransition('COMPLETED', 'STUDYING')).toThrow(
        /Illegal match state transition/
      );
    });
  });

  describe('resolveRound', () => {
    const fixedNow = new Date('2026-10-26T12:00:00.000Z');

    it('should resolve matching round into COMPLETED state with no study timer', () => {
      const result = resolveRound({
        roundNumber: 1,
        wordA: '  Ocean ',
        wordB: 'OCEAN',
        currentMismatchCount: 0,
        currentTime: fixedNow,
      });

      expect(result.isMatch).toBe(true);
      expect(result.nextStatus).toBe('COMPLETED');
      expect(result.normalizedA).toBe('ocean');
      expect(result.normalizedB).toBe('ocean');
      expect(result.mismatchCount).toBe(0);
      expect(result.studyDurationMinutes).toBeNull();
      expect(result.studyEndsAt).toBeNull();
    });

    it('should resolve 1st mismatch into STUDYING state with 15-minute study deadline', () => {
      const result = resolveRound({
        roundNumber: 1,
        wordA: 'River',
        wordB: 'Ocean',
        currentMismatchCount: 0,
        currentTime: fixedNow,
      });

      expect(result.isMatch).toBe(false);
      expect(result.nextStatus).toBe('STUDYING');
      expect(result.mismatchCount).toBe(1);
      expect(result.studyDurationMinutes).toBe(15);
      expect(result.studyEndsAt?.toISOString()).toBe('2026-10-26T12:15:00.000Z');
    });

    it('should resolve 2nd mismatch into STUDYING state with 30-minute study deadline', () => {
      const result = resolveRound({
        roundNumber: 2,
        wordA: 'Mountain',
        wordB: 'Hill',
        currentMismatchCount: 1,
        currentTime: fixedNow,
      });

      expect(result.isMatch).toBe(false);
      expect(result.nextStatus).toBe('STUDYING');
      expect(result.mismatchCount).toBe(2);
      expect(result.studyDurationMinutes).toBe(30);
      expect(result.studyEndsAt?.toISOString()).toBe('2026-10-26T12:30:00.000Z');
    });

    it('should throw Error if word submissions fail input validation', () => {
      expect(() =>
        resolveRound({
          roundNumber: 1,
          wordA: '',
          wordB: 'Valid',
          currentMismatchCount: 0,
        })
      ).toThrow(/Invalid Player A submission/);
    });
  });
});
