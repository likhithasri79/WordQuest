import { MatchStatus } from '../db/schema.js';

export type { MatchStatus };

export interface RoundResolutionResult {
  isMatch: boolean;
  roundNumber: number;
  wordA: string;
  wordB: string;
  normalizedA: string;
  normalizedB: string;
  nextStatus: 'COMPLETED' | 'STUDYING';
  mismatchCount: number;
  studyDurationMinutes: number | null;
  studyEndsAt: Date | null;
}

export interface WordValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}
