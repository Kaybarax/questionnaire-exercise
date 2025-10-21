import { describe, it, expect } from 'vitest';
import { ResponseValidator } from '../src/validator';
import { QuestionConfig } from '../src/types';

describe('ResponseValidator', () => {
  const validator = new ResponseValidator();

  describe('Text input validation', () => {
    const textQuestion: QuestionConfig = {
      id: 'q1',
      text: 'What is your name?',
      type: 'text',
    };

    it('should accept non-empty text input', () => {
      const result = validator.validate('John Doe', textQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should reject empty text input', () => {
      const result = validator.validate('', textQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Input cannot be empty. Please provide an answer.');
    });

    it('should reject whitespace-only input', () => {
      const result = validator.validate('   ', textQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Input cannot be empty. Please provide an answer.');
    });
  });

  describe('Yes/No validation', () => {
    const yesNoQuestion: QuestionConfig = {
      id: 'q2',
      text: 'Do you agree?',
      type: 'yesno',
    };

    it('should accept "yes" (lowercase)', () => {
      const result = validator.validate('yes', yesNoQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should accept "no" (lowercase)', () => {
      const result = validator.validate('no', yesNoQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should accept "y" (lowercase)', () => {
      const result = validator.validate('y', yesNoQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should accept "n" (lowercase)', () => {
      const result = validator.validate('n', yesNoQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should accept "YES" (uppercase)', () => {
      const result = validator.validate('YES', yesNoQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should accept "No" (mixed case)', () => {
      const result = validator.validate('No', yesNoQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid yes/no input', () => {
      const result = validator.validate('maybe', yesNoQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid input. Expected: yes, no, y, or n (case-insensitive). Please try again.');
    });

    it('should reject empty yes/no input', () => {
      const result = validator.validate('', yesNoQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Input cannot be empty. Please provide an answer.');
    });
  });

  describe('Multiple-choice validation', () => {
    const multipleChoiceQuestion: QuestionConfig = {
      id: 'q3',
      text: 'What is your favorite color?',
      type: 'multiple-choice',
      choices: ['Red', 'Blue', 'Green', 'Yellow'],
    };

    it('should accept valid choice', () => {
      const result = validator.validate('Red', multipleChoiceQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should accept another valid choice', () => {
      const result = validator.validate('Blue', multipleChoiceQuestion);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid choice', () => {
      const result = validator.validate('Purple', multipleChoiceQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid choice. Expected one of: Red, Blue, Green, Yellow. Please try again.');
    });

    it('should reject choice with wrong case', () => {
      const result = validator.validate('red', multipleChoiceQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid choice');
    });

    it('should reject empty multiple-choice input', () => {
      const result = validator.validate('', multipleChoiceQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Input cannot be empty. Please provide an answer.');
    });
  });
});
