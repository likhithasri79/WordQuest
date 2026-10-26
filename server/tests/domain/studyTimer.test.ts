import { describe, it, expect } from 'vitest';
import {
  calculateStudyDurationMinutes,
  calculateStudyEndsAt,
  isStudyPeriodExpired,
  getRemainingStudySeconds,
} from '../../src/domain/studyTimer.js';

describe('Progressive Study Timer Domain Logic', () => {
  describe('calculateStudyDurationMinutes (15 * mismatchCount)', () => {
    it('should return 0 for 0 or negative mismatches', () => {
      expect(calculateStudyDurationMinutes(0)).toBe(0);
      expect(calculateStudyDurationMinutes(-1)).toBe(0);
    });

    it('should calculate exact progression for consecutive mismatches', () => {
      expect(calculateStudyDurationMinutes(1)).toBe(15);
      expect(calculateStudyDurationMinutes(2)).toBe(30);
      expect(calculateStudyDurationMinutes(3)).toBe(45);
      expect(calculateStudyDurationMinutes(4)).toBe(60);
      expect(calculateStudyDurationMinutes(10)).toBe(150);
    });
  });

  describe('calculateStudyEndsAt', () => {
    it('should add exact duration in milliseconds to base time', () => {
      const baseTime = new Date('2026-10-26T12:00:00.000Z');
      const deadline1 = calculateStudyEndsAt(1, baseTime);
      expect(deadline1.toISOString()).toBe('2026-10-26T12:15:00.000Z');

      const deadline2 = calculateStudyEndsAt(2, baseTime);
      expect(deadline2.toISOString()).toBe('2026-10-26T12:30:00.000Z');
    });
  });

  describe('isStudyPeriodExpired & getRemainingStudySeconds', () => {
    it('should treat null deadline as expired (ready for next round)', () => {
      expect(isStudyPeriodExpired(null)).toBe(true);
      expect(getRemainingStudySeconds(null)).toBe(0);
    });

    it('should accurately detect expired and active study periods', () => {
      const now = new Date('2026-10-26T12:00:00.000Z');
      const futureDeadline = new Date('2026-10-26T12:15:00.000Z');
      const pastDeadline = new Date('2026-10-26T11:45:00.000Z');

      expect(isStudyPeriodExpired(futureDeadline, now)).toBe(false);
      expect(isStudyPeriodExpired(pastDeadline, now)).toBe(true);
      expect(isStudyPeriodExpired(now, now)).toBe(true);

      expect(getRemainingStudySeconds(futureDeadline, now)).toBe(15 * 60);
      expect(getRemainingStudySeconds(pastDeadline, now)).toBe(0);
    });
  });
});
