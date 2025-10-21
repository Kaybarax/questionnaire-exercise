import { randomUUID } from 'node:crypto';
import { ConfigLoader } from './config-loader.js';
import { ResponseValidator } from './validator.js';
import { ConditionEvaluator } from './condition-evaluator.js';
import { UserInputHandler, QuestionnaireConfig, QuestionConfig } from './types.js';
import { Logger } from './logger.js';

/**
 * Result of a questionnaire session
 */
export class SessionResult {
  constructor(
    public readonly id: string,
    public readonly responses: Map<string, string>,
    private readonly config: QuestionnaireConfig
  ) {}

  /**
   * Convert responses to JSON format with question-answer pairs
   */
  json(): { question: string; answer: string }[] {
    const result: { question: string; answer: string }[] = [];
    
    for (const [questionId, answer] of this.responses.entries()) {
      const question = this.config.questions.find(q => q.id === questionId);
      if (question) {
        result.push({
          question: question.text,
          answer: answer
        });
      }
    }
    
    return result;
  }
}

/**
 * Core questionnaire engine that orchestrates the session flow
 */
export class QuestionnaireEngine {
  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly validator: ResponseValidator,
    private readonly conditionEvaluator: ConditionEvaluator,
    private readonly inputHandler: UserInputHandler,
    private readonly logger: Logger,
    private readonly configPath: string
  ) {}

  /**
   * Run a complete questionnaire session
   * @param sessionId Unique identifier for this session
   * @returns SessionResult containing all responses
   */
  async runSession(sessionId: string = randomUUID()): Promise<SessionResult> {
    this.logger.info(`Starting session ${sessionId}`);
    
    // Load configuration
    const config = await this.configLoader.load(this.configPath);
    this.logger.info(`Loaded questionnaire: ${config.title}`);
    
    // Initialize response storage
    const responses = new Map<string, string>();
    
    // Display questionnaire title
    this.inputHandler.display(`\n=== ${config.title} ===\n`);
    
    // Iterate through questions
    for (const question of config.questions) {
      // Evaluate conditions
      if (!this.conditionEvaluator.shouldDisplay(question, responses)) {
        this.logger.info(`Skipping question ${question.id} due to unmet condition`);
        continue;
      }
      
      // Prompt user and collect response with validation
      const response = await this.promptWithValidation(question);
      
      // Store response
      responses.set(question.id, response);
      this.logger.info(`Stored response for ${question.id}: ${response}`);
    }
    
    // Create and return session result
    const result = new SessionResult(sessionId, responses, config);
    this.logger.info(`Session ${sessionId} completed with ${responses.size} responses`);
    
    return result;
  }

  /**
   * Prompt user for a question and validate response, retrying on validation failure
   * @param question Question configuration
   * @returns Valid user response
   */
  private async promptWithValidation(question: QuestionConfig): Promise<string> {
    while (true) {
      // Display question with choices if applicable
      let promptMessage = `${question.text}`;
      
      if (question.type === 'multiple-choice' && question.choices) {
        promptMessage += `\nChoices: ${question.choices.join(', ')}`;
      } else if (question.type === 'yesno') {
        promptMessage += ` (yes/no)`;
      }
      
      promptMessage += '\n> ';
      
      // Get user input
      const input = await this.inputHandler.prompt(promptMessage);
      
      // Validate response
      const validationResult = this.validator.validate(input, question);
      
      if (validationResult.isValid) {
        return input.trim();
      }
      
      // Display error and retry
      if (validationResult.errorMessage) {
        this.inputHandler.displayError(validationResult.errorMessage);
      }
    }
  }
}
