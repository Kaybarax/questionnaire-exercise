/**
 * Configuration types for the Questionnaire Engine
 */

export interface QuestionConfig {
  id: string;
  text: string;
  type: 'text' | 'yesno' | 'multiple-choice';
  choices?: string[];
  condition?: {
    questionId: string;
    expectedAnswer: string | string[];
  };
}

export interface QuestionnaireConfig {
  title: string;
  questions: QuestionConfig[];
}

/**
 * Result of validating a user response
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Interface for handling user input and output
 */
export interface UserInputHandler {
  prompt(message: string): Promise<string>;
  display(message: string): void;
  displayError(message: string): void;
  close(): void;
}
