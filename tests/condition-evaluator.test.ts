import { describe, it, expect } from 'vitest';
import { ConditionEvaluator } from '../src/condition-evaluator';
import { QuestionConfig } from '../src/types';

describe('ConditionEvaluator', () => {
  const evaluator = new ConditionEvaluator();

  describe('Unconditional questions', () => {
    it('should always display questions without conditions', () => {
      const question: QuestionConfig = {
        id: 'q1',
        text: 'What is your name?',
        type: 'text',
      };

      const responses = new Map<string, string>();
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });

    it('should display unconditional questions even with existing responses', () => {
      const question: QuestionConfig = {
        id: 'q2',
        text: 'What is your age?',
        type: 'text',
      };

      const responses = new Map([
        ['q1', 'John'],
        ['q3', 'yes'],
      ]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });
  });

  describe('Conditional questions with exact match', () => {
    it('should display question when condition matches (string expectedAnswer)', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'What kind of pet?',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'yes',
        },
      };

      const responses = new Map([['q2', 'yes']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });

    it('should not display question when condition does not match', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'What kind of pet?',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'yes',
        },
      };

      const responses = new Map([['q2', 'no']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(false);
    });

    it('should display question when condition matches (array expectedAnswer)', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'What kind of pet?',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: ['yes', 'y'],
        },
      };

      const responses = new Map([['q2', 'y']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });

    it('should display question when any expected answer matches', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'What kind of pet?',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: ['yes', 'y'],
        },
      };

      const responses = new Map([['q2', 'yes']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });
  });

  describe('Case-insensitive comparison for yes/no answers', () => {
    it('should match "yes" regardless of case', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'Follow-up question',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'yes',
        },
      };

      const responses = new Map([['q2', 'YES']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });

    it('should match "no" regardless of case', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'Follow-up question',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'no',
        },
      };

      const responses = new Map([['q2', 'No']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });

    it('should match "y" regardless of case', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'Follow-up question',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: ['y', 'yes'],
        },
      };

      const responses = new Map([['q2', 'Y']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });

    it('should handle whitespace in responses', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'Follow-up question',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'yes',
        },
      };

      const responses = new Map([['q2', '  yes  ']]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(true);
    });
  });

  describe('Missing previous responses', () => {
    it('should not display question when referenced question has not been answered', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'Follow-up question',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'yes',
        },
      };

      const responses = new Map<string, string>();
      expect(evaluator.shouldDisplay(question, responses)).toBe(false);
    });

    it('should not display question when referenced question ID does not exist in responses', () => {
      const question: QuestionConfig = {
        id: 'q3',
        text: 'Follow-up question',
        type: 'text',
        condition: {
          questionId: 'q2',
          expectedAnswer: 'yes',
        },
      };

      const responses = new Map([
        ['q1', 'John'],
        ['q4', 'something'],
      ]);
      expect(evaluator.shouldDisplay(question, responses)).toBe(false);
    });
  });
});
