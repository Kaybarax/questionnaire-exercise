import { createLogger } from "./logger.js";
import { QuestionnaireEngine } from "./engine.js";
import { ConfigLoader } from "./config-loader.js";
import { ResponseValidator } from "./validator.js";
import { ConditionEvaluator } from "./condition-evaluator.js";
import { ReadlineUserInputHandler } from "./user-input-handler.js";

const logger = createLogger('main');

// Default configuration file path
const CONFIG_PATH = process.env.QUESTIONNAIRE_CONFIG || 'questionnaire.json';

/**
 * Display session summary in a formatted way
 */
function displaySessionSummary(sessionResult: { id: string; json(): { question: string; answer: string }[] }): void {
  console.log('\n' + '='.repeat(50));
  console.log('SESSION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Session ID: ${sessionResult.id}`);
  console.log('');
  
  const responses = sessionResult.json();
  responses.forEach((item, index) => {
    console.log(`${index + 1}. ${item.question}`);
    console.log(`   Answer: ${item.answer}`);
    console.log('');
  });
  
  console.log('='.repeat(50) + '\n');
}

/**
 * Main application entry point with cyclic session loop
 */
async function start() {
  logger.info('Application started');
  
  // Create dependencies
  const configLoader = new ConfigLoader();
  const validator = new ResponseValidator();
  const conditionEvaluator = new ConditionEvaluator();
  const inputHandler = new ReadlineUserInputHandler(createLogger('UserInputHandler'));
  
  // Create engine instance
  const engine = new QuestionnaireEngine(
    configLoader,
    validator,
    conditionEvaluator,
    inputHandler,
    createLogger('QuestionnaireEngine'),
    CONFIG_PATH
  );
  
  try {
    // Session loop - runs until user exits
    let continueRunning = true;
    let sessionCount = 0;
    
    while (continueRunning) {
      sessionCount++;
      logger.info(`Starting session ${sessionCount}`);
      
      try {
        // Run questionnaire session
        const sessionResult = await engine.runSession();
        
        // Display session summary
        displaySessionSummary(sessionResult);
        
        logger.info(`Session ${sessionResult.id} completed successfully`);
        
        // Prompt user to continue or exit
        const response = await inputHandler.prompt('Would you like to start a new session? (yes/no): ');
        const normalizedResponse = response.trim().toLowerCase();
        
        if (normalizedResponse === 'yes' || normalizedResponse === 'y') {
          logger.info('User chose to start new session');
          console.log('\n'); // Add spacing between sessions
        } else {
          logger.info('User chose to exit');
          continueRunning = false;
        }
        
      } catch (sessionError) {
        // Handle session-specific errors
        logger.error('Session error occurred', sessionError);
        
        if (sessionError instanceof Error) {
          console.error(`\n❌ Error: ${sessionError.message}\n`);
          
          // Check if it's a configuration error (unrecoverable)
          if (sessionError.message.includes('Configuration file not found') ||
              sessionError.message.includes('Failed to parse JSON') ||
              sessionError.message.includes('Configuration must')) {
            logger.error('Unrecoverable configuration error, exiting');
            inputHandler.close();
            process.exit(1);
          }
        }
        
        // For other errors, ask if user wants to retry
        const response = await inputHandler.prompt('An error occurred. Would you like to try again? (yes/no): ');
        const normalizedResponse = response.trim().toLowerCase();
        
        if (normalizedResponse !== 'yes' && normalizedResponse !== 'y') {
          logger.info('User chose not to retry after error');
          continueRunning = false;
        }
      }
    }
    
    // Clean exit
    inputHandler.display('\nThank you for using the Questionnaire Engine. Goodbye!');
    inputHandler.close();
    logger.info('Application exiting normally');
    process.exit(0);
    
  } catch (error) {
    // Handle unexpected errors
    logger.error('Unexpected error in main loop', error);
    inputHandler.close();
    
    if (error instanceof Error) {
      console.error(`\n❌ Fatal error: ${error.message}\n`);
    }
    
    process.exit(1);
  }
}

start().catch((error) => {
  logger.error('Application failed to start', error);
  console.error(`\n❌ Failed to start application: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});



