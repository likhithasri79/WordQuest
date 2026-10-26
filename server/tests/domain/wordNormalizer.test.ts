import { describe, it, expect } from 'vitest';
import {
  normalizeWord,
  validateWordInput,
  compareWords,
} from '../../src/domain/wordNormalizer.js';

describe('Word Normalizer & Validator Domain Logic', () => {
  describe('normalizeWord', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(normalizeWord('  hello  ')).toBe('hello');
    });

    it('should collapse multiple internal spaces into a single space', () => {
      expect(normalizeWord('deep    blue   sea')).toBe('deep blue sea');
    });

    it('should convert all letters to lowercase', () => {
      expect(normalizeWord('OcEaN')).toBe('ocean');
      expect(normalizeWord('SUNSHINE')).toBe('sunshine');
    });

    it('should preserve accents and internal punctuation deliberately', () => {
      expect(normalizeWord('café')).toBe('café');
      expect(normalizeWord("it's a match!")).toBe("it's a match!");
    });
  });

  describe('compareWords (Exact Normalized Equality)', () => {
    it('should match identical words with different casing and whitespace', () => {
      expect(compareWords('Ocean', 'ocean')).toBe(true);
      expect(compareWords('  beautiful ', 'beautiful')).toBe(true);
      expect(compareWords('blue   sky', 'blue sky')).toBe(true);
    });

    it('should match short words and long words without artificial letter constraints', () => {
      expect(compareWords('go', 'GO')).toBe(true);
      expect(compareWords('supercalifragilistic', 'Supercalifragilistic')).toBe(true);
    });

    it('should mismatch singular vs plural or related words', () => {
      expect(compareWords('river', 'rivers')).toBe(false);
      expect(compareWords('sun', 'moon')).toBe(false);
    });

    it('should mismatch when accents or punctuation differ', () => {
      expect(compareWords('café', 'cafe')).toBe(false);
      expect(compareWords("it's", 'its')).toBe(false);
    });
  });

  describe('validateWordInput', () => {
    it('should accept valid single words and multi-word phrases', () => {
      expect(validateWordInput('hello').valid).toBe(true);
      expect(validateWordInput('starry night').valid).toBe(true);
    });

    it('should reject empty or whitespace-only inputs', () => {
      expect(validateWordInput('').valid).toBe(false);
      expect(validateWordInput('   ').valid).toBe(false);
    });

    it('should reject inputs longer than 100 characters', () => {
      const longInput = 'a'.repeat(101);
      const res = validateWordInput(longInput);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maximum allowed length');
    });

    it('should reject non-string inputs', () => {
      expect(validateWordInput(12345).valid).toBe(false);
      expect(validateWordInput(null).valid).toBe(false);
    });

    it('should reject control characters and HTML tags', () => {
      expect(validateWordInput('hello\u0000world').valid).toBe(false);
      expect(validateWordInput('<script>alert("hack")</script>').valid).toBe(false);
    });
  });
});
