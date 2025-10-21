import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../src/config-loader';
import { writeFile, unlink, mkdir, rmdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('ConfigLoader', () => {
  const loader = new ConfigLoader();
  const testDir = join(process.cwd(), 'tests', 'fixtures');
  const testFilePath = join(testDir, 'test-config.json');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await unlink(testFilePath);
    } catch {
      // File might not exist
    }
    try {
      await rmdir(testDir);
    } catch {
      // Directory might not be empty or not exist
    }
  });

  describe('Valid JSON parsing', () => {
    it('should load valid configuration file', async () => {
      const validConfig = {
        title: 'Test Questionnaire',
        questions: [
          {
            id: 'q1',
            text: 'What is your name?',
            type: 'text',
          },
        ],
      };

      await writeFile(testFilePath, JSON.stringify(validConfig));
      const result = await loader.load(testFilePath);

      expect(result).toEqual(validConfig);
      expect(result.title).toBe('Test Questionnaire');
      expect(result.questions).toHaveLength(1);
    });

    it('should load configuration with multiple questions', async () => {
      const config = {
        title: 'Multi-Question Test',
        questions: [
          { id: 'q1', text: 'Question 1?', type: 'text' },
          { id: 'q2', text: 'Question 2?', type: 'yesno' },
          { id: 'q3', text: 'Question 3?', type: 'multiple-choice', choices: ['A', 'B'] },
        ],
      };

      await writeFile(testFilePath, JSON.stringify(config));
      const result = await loader.load(testFilePath);

      expect(result.questions).toHaveLength(3);
    });

    it('should load configuration with conditional questions', async () => {
      const config = {
        title: 'Conditional Test',
        questions: [
          { id: 'q1', text: 'Do you have a pet?', type: 'yesno' },
          {
            id: 'q2',
            text: 'What kind?',
            type: 'text',
            condition: { questionId: 'q1', expectedAnswer: 'yes' },
          },
        ],
      };

      await writeFile(testFilePath, JSON.stringify(config));
      const result = await loader.load(testFilePath);

      expect(result.questions[1].condition).toBeDefined();
      expect(result.questions[1].condition?.questionId).toBe('q1');
    });
  });

  describe('Malformed JSON handling', () => {
    it('should throw error for invalid JSON syntax', async () => {
      await writeFile(testFilePath, '{ invalid json }');

      await expect(loader.load(testFilePath)).rejects.toThrow('Failed to parse JSON');
    });

    it('should throw error for incomplete JSON', async () => {
      await writeFile(testFilePath, '{ "title": "Test"');

      await expect(loader.load(testFilePath)).rejects.toThrow('Failed to parse JSON');
    });
  });

  describe('Missing file handling', () => {
    it('should throw error when file does not exist', async () => {
      const nonExistentPath = join(testDir, 'non-existent.json');

      await expect(loader.load(nonExistentPath)).rejects.toThrow('Configuration file not found');
    });
  });

  describe('Schema validation', () => {
    it('should throw error when config is not an object', async () => {
      await writeFile(testFilePath, '[]');

      await expect(loader.load(testFilePath)).rejects.toThrow('Configuration must have a "title" field');
    });

    it('should throw error when title is missing', async () => {
      const config = { questions: [] };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Configuration must have a "title" field');
    });

    it('should throw error when questions is not an array', async () => {
      const config = { title: 'Test', questions: 'not an array' };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Configuration must have a "questions" field of type array');
    });

    it('should throw error when questions array is empty', async () => {
      const config = { title: 'Test', questions: [] };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Configuration must have at least one question');
    });

    it('should throw error when question is missing id', async () => {
      const config = {
        title: 'Test',
        questions: [{ text: 'Question?', type: 'text' }],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 must have an "id" field');
    });

    it('should throw error when question is missing text', async () => {
      const config = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'text' }],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 must have a "text" field');
    });

    it('should throw error when question has invalid type', async () => {
      const config = {
        title: 'Test',
        questions: [{ id: 'q1', text: 'Question?', type: 'invalid-type' }],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 has invalid type');
    });

    it('should throw error when multiple-choice question has no choices', async () => {
      const config = {
        title: 'Test',
        questions: [{ id: 'q1', text: 'Question?', type: 'multiple-choice' }],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 with type "multiple-choice" must have a non-empty "choices" array');
    });

    it('should throw error when multiple-choice choices are not strings', async () => {
      const config = {
        title: 'Test',
        questions: [{ id: 'q1', text: 'Question?', type: 'multiple-choice', choices: [1, 2, 3] }],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 has invalid choices');
    });

    it('should throw error when condition is missing questionId', async () => {
      const config = {
        title: 'Test',
        questions: [
          { id: 'q1', text: 'Question?', type: 'text', condition: { expectedAnswer: 'yes' } },
        ],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 condition must have a "questionId" field');
    });

    it('should throw error when condition is missing expectedAnswer', async () => {
      const config = {
        title: 'Test',
        questions: [
          { id: 'q1', text: 'Question?', type: 'text', condition: { questionId: 'q0' } },
        ],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      await expect(loader.load(testFilePath)).rejects.toThrow('Question at index 0 condition must have an "expectedAnswer" field');
    });

    it('should accept condition with string expectedAnswer', async () => {
      const config = {
        title: 'Test',
        questions: [
          { id: 'q1', text: 'First?', type: 'text' },
          {
            id: 'q2',
            text: 'Second?',
            type: 'text',
            condition: { questionId: 'q1', expectedAnswer: 'yes' },
          },
        ],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      const result = await loader.load(testFilePath);
      expect(result.questions[1].condition?.expectedAnswer).toBe('yes');
    });

    it('should accept condition with array expectedAnswer', async () => {
      const config = {
        title: 'Test',
        questions: [
          { id: 'q1', text: 'First?', type: 'text' },
          {
            id: 'q2',
            text: 'Second?',
            type: 'text',
            condition: { questionId: 'q1', expectedAnswer: ['yes', 'y'] },
          },
        ],
      };
      await writeFile(testFilePath, JSON.stringify(config));

      const result = await loader.load(testFilePath);
      expect(result.questions[1].condition?.expectedAnswer).toEqual(['yes', 'y']);
    });
  });
});
