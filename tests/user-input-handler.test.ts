import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReadlineUserInputHandler } from '../src/user-input-handler';
import { createLogger } from '../src/logger';
import * as readline from 'node:readline';

// Mock readline module
vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

describe('ReadlineUserInputHandler', () => {
  let mockRl: {
    question: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
  };
  let handler: ReadlineUserInputHandler;
  let logger: ReturnType<typeof createLogger>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create mock readline interface
    mockRl = {
      question: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
    };

    // Mock createInterface to return our mock
    (readline.createInterface as ReturnType<typeof vi.fn>).mockReturnValue(mockRl);

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger = createLogger('TestHandler');
    handler = new ReadlineUserInputHandler(logger);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create readline interface with stdin and stdout', () => {
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
    });

    it('should register SIGINT handler', () => {
      expect(mockRl.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });
  });

  describe('prompt', () => {
    it('should display message and return user input', async () => {
      const userInput = 'John Doe';
      mockRl.question.mockImplementation((msg: string, callback: (answer: string) => void) => {
        callback(userInput);
      });

      const result = await handler.prompt('What is your name? ');

      expect(mockRl.question).toHaveBeenCalledWith('What is your name? ', expect.any(Function));
      expect(result).toBe(userInput);
    });

    it('should handle empty input', async () => {
      mockRl.question.mockImplementation((msg: string, callback: (answer: string) => void) => {
        callback('');
      });

      const result = await handler.prompt('Enter something: ');

      expect(result).toBe('');
    });

    it('should handle multiple prompts sequentially', async () => {
      mockRl.question
        .mockImplementationOnce((msg: string, callback: (answer: string) => void) => {
          callback('First');
        })
        .mockImplementationOnce((msg: string, callback: (answer: string) => void) => {
          callback('Second');
        });

      const result1 = await handler.prompt('First question: ');
      const result2 = await handler.prompt('Second question: ');

      expect(result1).toBe('First');
      expect(result2).toBe('Second');
      expect(mockRl.question).toHaveBeenCalledTimes(2);
    });
  });

  describe('display', () => {
    it('should output message to console', () => {
      handler.display('Hello, World!');

      expect(consoleLogSpy).toHaveBeenCalledWith('Hello, World!');
    });

    it('should handle empty messages', () => {
      handler.display('');

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should handle multiline messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      handler.display(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('displayError', () => {
    it('should output error message with emoji prefix', () => {
      handler.displayError('Something went wrong');

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Something went wrong');
    });

    it('should format validation errors', () => {
      handler.displayError('Invalid input. Expected: yes or no');

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid input. Expected: yes or no');
    });
  });

  describe('close', () => {
    it('should close readline interface', () => {
      handler.close();

      expect(mockRl.close).toHaveBeenCalled();
    });
  });

  describe('SIGINT handling', () => {
    it('should handle Ctrl+C gracefully', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Get the SIGINT handler that was registered
      const sigintHandler = mockRl.on.mock.calls.find(call => call[0] === 'SIGINT')?.[1];
      expect(sigintHandler).toBeDefined();

      // Trigger SIGINT
      sigintHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith('\n\nGoodbye!');
      expect(mockRl.close).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });
  });
});
