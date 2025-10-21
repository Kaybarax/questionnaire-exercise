import { readFile } from 'node:fs/promises';
import { QuestionnaireConfig, QuestionConfig } from './types';

/**
 * ConfigLoader is responsible for loading and parsing questionnaire configuration
 * from JSON files with proper error handling.
 */
export class ConfigLoader {
  /**
   * Load questionnaire configuration from a JSON file
   * @param filePath - Path to the configuration file
   * @returns Parsed questionnaire configuration
   * @throws Error if file is missing, malformed, or invalid
   */
  async load(filePath: string): Promise<QuestionnaireConfig> {
    try {
      // Read file content
      const fileContent = await readFile(filePath, 'utf-8');
      
      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
      }
      
      // Validate configuration structure
      this.validateConfig(parsed);
      
      return parsed as QuestionnaireConfig;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a file not found error
        if ('code' in error && error.code === 'ENOENT') {
          throw new Error(`Configuration file not found: ${filePath}`);
        }
        // Re-throw validation or parsing errors
        throw error;
      }
      throw new Error(`Failed to load configuration: ${String(error)}`);
    }
  }

  /**
   * Validate the structure of the parsed configuration
   * @param config - Parsed configuration object
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: unknown): asserts config is QuestionnaireConfig {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be an object');
    }

    const cfg = config as Record<string, unknown>;

    // Validate title
    if (!cfg.title || typeof cfg.title !== 'string') {
      throw new Error('Configuration must have a "title" field of type string');
    }

    // Validate questions array
    if (!Array.isArray(cfg.questions)) {
      throw new Error('Configuration must have a "questions" field of type array');
    }

    if (cfg.questions.length === 0) {
      throw new Error('Configuration must have at least one question');
    }

    // Validate each question
    cfg.questions.forEach((question, index) => {
      this.validateQuestion(question, index);
    });
  }

  /**
   * Validate a single question configuration
   * @param question - Question object to validate
   * @param index - Index of the question in the array (for error messages)
   * @throws Error if question is invalid
   */
  private validateQuestion(question: unknown, index: number): asserts question is QuestionConfig {
    if (!question || typeof question !== 'object') {
      throw new Error(`Question at index ${index} must be an object`);
    }

    const q = question as Record<string, unknown>;

    // Validate id
    if (!q.id || typeof q.id !== 'string') {
      throw new Error(`Question at index ${index} must have an "id" field of type string`);
    }

    // Validate text
    if (!q.text || typeof q.text !== 'string') {
      throw new Error(`Question at index ${index} must have a "text" field of type string`);
    }

    // Validate type
    if (!q.type || typeof q.type !== 'string') {
      throw new Error(`Question at index ${index} must have a "type" field of type string`);
    }

    const validTypes = ['text', 'yesno', 'multiple-choice'];
    if (!validTypes.includes(q.type)) {
      throw new Error(`Question at index ${index} has invalid type "${q.type}". Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate choices for multiple-choice questions
    if (q.type === 'multiple-choice') {
      if (!Array.isArray(q.choices) || q.choices.length === 0) {
        throw new Error(`Question at index ${index} with type "multiple-choice" must have a non-empty "choices" array`);
      }

      if (!q.choices.every((choice) => typeof choice === 'string')) {
        throw new Error(`Question at index ${index} has invalid choices. All choices must be strings`);
      }
    }

    // Validate condition if present
    if (q.condition !== undefined) {
      this.validateCondition(q.condition, index);
    }
  }

  /**
   * Validate a question condition
   * @param condition - Condition object to validate
   * @param questionIndex - Index of the question (for error messages)
   * @throws Error if condition is invalid
   */
  private validateCondition(condition: unknown, questionIndex: number): void {
    if (!condition || typeof condition !== 'object') {
      throw new Error(`Question at index ${questionIndex} has invalid condition. Must be an object`);
    }

    const cond = condition as Record<string, unknown>;

    // Validate questionId
    if (!cond.questionId || typeof cond.questionId !== 'string') {
      throw new Error(`Question at index ${questionIndex} condition must have a "questionId" field of type string`);
    }

    // Validate expectedAnswer
    if (cond.expectedAnswer === undefined) {
      throw new Error(`Question at index ${questionIndex} condition must have an "expectedAnswer" field`);
    }

    const isString = typeof cond.expectedAnswer === 'string';
    const isStringArray = Array.isArray(cond.expectedAnswer) && 
      cond.expectedAnswer.length > 0 &&
      cond.expectedAnswer.every((item) => typeof item === 'string');

    if (!isString && !isStringArray) {
      throw new Error(`Question at index ${questionIndex} condition "expectedAnswer" must be a string or non-empty array of strings`);
    }
  }
}
