import { QuestionConfig, ValidationResult } from './types';

/**
 * ResponseValidator validates user input based on question type
 * and provides specific error messages for validation failures.
 */
export class ResponseValidator {
  /**
   * Validate user input against question configuration
   * @param input - User input string
   * @param question - Question configuration
   * @returns ValidationResult with isValid flag and optional error message
   */
  validate(input: string, question: QuestionConfig): ValidationResult {
    // Trim whitespace from input
    const trimmedInput = input.trim();

    // Check for empty input (applies to all question types)
    if (trimmedInput === '') {
      return {
        isValid: false,
        errorMessage: 'Input cannot be empty. Please provide an answer.',
      };
    }

    // Validate based on question type
    switch (question.type) {
      case 'text':
        return this.validateText(trimmedInput);
      case 'yesno':
        return this.validateYesNo(trimmedInput);
      case 'multiple-choice':
        return this.validateMultipleChoice(trimmedInput, question);
      default:
        return {
          isValid: false,
          errorMessage: `Unknown question type: ${question.type}`,
        };
    }
  }

  /**
   * Validate text input (non-empty check)
   * @param input - Trimmed user input
   * @returns ValidationResult
   */
  private validateText(input: string): ValidationResult {
    // Text input just needs to be non-empty (already checked in main validate method)
    return {
      isValid: true,
    };
  }

  /**
   * Validate yes/no input with case-insensitive matching
   * @param input - Trimmed user input
   * @returns ValidationResult
   */
  private validateYesNo(input: string): ValidationResult {
    const normalizedInput = input.toLowerCase();
    const validAnswers = ['yes', 'no', 'y', 'n'];

    if (validAnswers.includes(normalizedInput)) {
      return {
        isValid: true,
      };
    }

    return {
      isValid: false,
      errorMessage: 'Invalid input. Expected: yes, no, y, or n (case-insensitive). Please try again.',
    };
  }

  /**
   * Validate multiple-choice input against defined choices
   * @param input - Trimmed user input
   * @param question - Question configuration with choices
   * @returns ValidationResult
   */
  private validateMultipleChoice(input: string, question: QuestionConfig): ValidationResult {
    if (!question.choices || question.choices.length === 0) {
      return {
        isValid: false,
        errorMessage: 'No choices defined for this question.',
      };
    }

    // Check if input matches one of the choices (case-sensitive)
    if (question.choices.includes(input)) {
      return {
        isValid: true,
      };
    }

    // Generate error message with available choices
    const choicesList = question.choices.join(', ');
    return {
      isValid: false,
      errorMessage: `Invalid choice. Expected one of: ${choicesList}. Please try again.`,
    };
  }
}
