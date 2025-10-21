import { QuestionConfig } from './types';

/**
 * Evaluates conditional logic for question display
 */
export class ConditionEvaluator {
  /**
   * Determines if a question should be displayed based on its conditions
   * @param question The question configuration to evaluate
   * @param responses Map of previous responses (questionId -> answer)
   * @returns true if the question should be displayed, false otherwise
   */
  shouldDisplay(question: QuestionConfig, responses: Map<string, string>): boolean {
    // If no condition is specified, always display the question
    if (!question.condition) {
      return true;
    }

    const { questionId, expectedAnswer } = question.condition;

    // Get the previous response for the referenced question
    const previousResponse = responses.get(questionId);

    // If the previous question hasn't been answered, don't display this question
    if (previousResponse === undefined) {
      return false;
    }

    // Normalize the expected answer(s) to an array for consistent handling
    const expectedAnswers = Array.isArray(expectedAnswer) ? expectedAnswer : [expectedAnswer];

    // Check if the previous response matches any of the expected answers
    // Use case-insensitive comparison for yes/no answers
    return expectedAnswers.some(expected => {
      const normalizedExpected = expected.toLowerCase().trim();
      const normalizedResponse = previousResponse.toLowerCase().trim();
      return normalizedExpected === normalizedResponse;
    });
  }
}
