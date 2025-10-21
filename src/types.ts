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
