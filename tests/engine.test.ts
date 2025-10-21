import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionnaireEngine, SessionResult } from '../src/engine';
import { ConfigLoader } from '../src/config-loader';
import { ResponseValidator } from '../src/validator';
import { ConditionEvaluator } from '../src/condition-evaluator';
import { UserInputHandler, QuestionnaireConfig, QuestionConfig } from '../src/types';
import { createLogger } from '../src/logger';

describe('QuestionnaireEngine', () => {
  let mockConfigLoader: ConfigLoader;
  let mockValidator: ResponseValidator;
  let mockConditionEvaluator: ConditionEvaluator;
  let mockInputHandler: UserInputHandler;
  let logger: ReturnType<typeof createLogger>;

  const sampleConfig: QuestionnaireConfig = {
    title: 'Test Questionnaire',
    questions: [
      {
        id: 'q1',
        text: 'What is your name?',
        type: 'text',
      },
      {
        id: 'q2',
        text: 'Do you have a pet?',
        type: 'yesno',
      },
      {
        id: 'q3',
        text: 'What kind of pet?',
        type: 'multiple-choice',
        choices: ['Dog', 'Cat', 'Bird'],
        condition: {
          questionId: 'q2',
          expectedAnswer: ['yes', 'y'],
        },
      },
    ],
  };

  beforeEach(() => {
    // Create mock dependencies
    mockConfigLoader = {
      load: vi.fn().mockResolvedValue(sampleConfig),
    } as unknown as ConfigLoader;

    mockValidator = {
      validate: vi.fn().mockReturnValue({ isValid: true }),
    } as unknown as ResponseValidator;

    mockConditionEvaluator = {
      shouldDisplay: vi.fn().mockReturnValue(true),
    } as unknown as ConditionEvaluator;

    mockInputHandler = {
      prompt: vi.fn(),
      display: vi.fn(),
      displayError: vi.fn(),
      close: vi.fn(),
    } as UserInputHandler;

    logger = createLogger('TestEngine');
  });

  describe('runSession', () => {
    it('should complete a full session and return SessionResult', async () => {
      // Setup mock responses
      (mockInputHandler.prompt as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce('John Doe')
        .mockResolvedValueOnce('yes')
        .mockResolvedValueOnce('Dog');

      const engine = new QuestionnaireEngine(
        mockConfigLoader,
        mockValidator,
        mockConditionEvaluator,
        mockInputHandler,
        logger,
        'test.json'
      );

      const result = await engine.runSession('test-session-1');

      expect(result).toBeInstanceOf(SessionResult);
      expect(result.id).toBe('test-session-1');
      expect(result.responses.size).toBe(3);
      expect(result.responses.get('q1')).toBe('John Doe');
      expect(result.responses.get('q2')).toBe('yes');
      expect(result.responses.get('q3')).toBe('Dog');
    });

    it('should load configuration at session start', async () => {
      (mockInputHandler.prompt as ReturnType<typeof vi.fn>).mockResolvedValue('answer');

      const engine = new QuestionnaireEngine(
        mockConfigLoader,
        mockValidator,
        mockConditionEvaluator,
        mockInputHandler,
        logger,
        'questionnaire.json'
      );

      await engine.runSession();

      expect(mockConfigLoader.load).toHaveBeenCalledWith('questionnaire.json');
    });

    it('should display questionnaire title', async () => {
      (mockInputHandler.prompt as ReturnType<typeof vi.fn>).mockResolvedValue('answer');

      const engine = new QuestionnaireEngine(
        mockConfigLoader,
        mockValidator,
        mockConditionEvaluator,
        mockInputHandler,
        logger,
        'test.json'
      );

      await engine.runSession();

      expect(mockInputHandler.display).toHaveBeenCalledWith('\n=== Test Questionnaire ===\n');
    });

    it('should skip questions that do not meet conditions', async () => {
      // Mock condition evaluator to skip q3
      (mockConditionEvaluator.shouldDisplay as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(true)  // q1
        .mockReturnValueOnce(true)  // q2
        .mockReturnValueOnce(false); // q3 - skip

      (mockInputHandler.prompt as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('no');

      const engine = new QuestionnaireEngine(
        mockConfigLoader,
        mockValidator,
        mockConditionEvaluator,
        mockInputHandler,
        logger,
        'test.json'
      );

      const result = await engine.runSession();

      expect(result.responses.size).toBe(2);
      expect(result.responses.has('q3')).toBe(false);
      expect(mockInputHandler.prompt).toHaveBeenCalledTimes(2);
    });

    it('should retry on validation failure', async () => {
      // First attempt fails, second succeeds
      (mockValidator.validate as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ isValid: false, errorMessage: 'Invalid input' })
        .mockReturnValue({ isValid: true });

      (mockInputHandler.prompt as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('yes')
        .mockResolvedValueOnce('Dog');

      const engine = new QuestionnaireEngine(
        mockConfigLoader,
        mockValidator,
        mockConditionEvaluator,
        mockInputHandler,
        logger,
        'test.json'
      );

      const result = await engine.runSession();

      expect(mockInputHandler.displayError).toHaveBeenCalledWith('Invalid input');
      expect(result.responses.get('q1')).toBe('John');
    });

    it('should store responses with question ID as key', async () => {
      (mockInputHandler.prompt as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce('Alice')
        .mockResolvedValueOnce('no')
        .mockResolvedValueOnce('Cat');

      const engine = new QuestionnaireEngine(
        mockConfigLoader,
        mockValidator,
        mockConditionEvaluator,
        mockInputHandler,
        logger,
        'test.json'
      );

      const result = await engine.runSession();

      expect(result.responses.get('q1')).toBe('Alice');
      expect(result.responses.get('q2')).toBe('no');
      expect(result.responses.get('q3')).toBe('Cat');
    });
  });

  describe('SessionResult', () => {
    it('should format responses as question-answer pairs', () => {
      const responses = new Map<string, string>([
        ['q1', 'John Doe'],
        ['q2', 'yes'],
      ]);

      const result = new SessionResult('test-id', responses, sampleConfig);
      const json = result.json();

      expect(json).toEqual([
        { question: 'What is your name?', answer: 'John Doe' },
        { question: 'Do you have a pet?', answer: 'yes' },
      ]);
    });

    it('should include question text from configuration', () => {
      const responses = new Map<string, string>([['q1', 'Alice']]);

      const result = new SessionResult('test-id', responses, sampleConfig);
      const json = result.json();

      expect(json[0].question).toBe('What is your name?');
    });

    it('should handle empty responses', () => {
      const responses = new Map<string, string>();

      const result = new SessionResult('test-id', responses, sampleConfig);
      const json = result.json();

      expect(json).toEqual([]);
    });
  });
});
