import { WordValidationResult } from './types.js';

export const MAX_WORD_LENGTH = 100;
export const MIN_WORD_LENGTH = 1;

// Control characters pattern (ASCII 0-31 and 127)
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/;

// HTML tag pattern to prevent injection attacks
const HTML_TAG_REGEX = /<[^>]*>/;

/**
 * Authoritative Word Normalization Function
 * - Trims leading and trailing whitespace.
 * - Collapses internal consecutive whitespace into a single space.
 * - Converts to lowercase.
 * - Intentionally preserves accents, internal punctuation, and spelling differences.
 */
export function normalizeWord(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Validates player word or phrase input against security and formatting constraints.
 */
export function validateWordInput(raw: unknown): WordValidationResult {
  if (typeof raw !== 'string') {
    return { valid: false, error: 'Submission must be a text string.' };
  }

  const trimmed = raw.trim();

  if (trimmed.length < MIN_WORD_LENGTH) {
    return { valid: false, error: 'Word or phrase cannot be empty.' };
  }

  if (trimmed.length > MAX_WORD_LENGTH) {
    return {
      valid: false,
      error: `Submission exceeds maximum allowed length of ${MAX_WORD_LENGTH} characters.`,
    };
  }

  if (CONTROL_CHARS_REGEX.test(raw)) {
    return { valid: false, error: 'Submission contains forbidden control characters.' };
  }

  if (HTML_TAG_REGEX.test(raw)) {
    return { valid: false, error: 'HTML tags or script markup are not permitted.' };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Authoritative Word Comparison
 * Compares two submissions for exact equality after normalization.
 * No AI, embeddings, synonyms, or fuzzy matching.
 */
export function compareWords(wordA: string, wordB: string): boolean {
  return normalizeWord(wordA) === normalizeWord(wordB);
}
