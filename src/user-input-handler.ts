import * as readline from 'node:readline';
import { Logger } from './logger.js';
import { UserInputHandler } from './types.js';

/**
 * Implementation of UserInputHandler using Node.js readline module
 */
export class ReadlineUserInputHandler implements UserInputHandler {
  private rl: readline.Interface;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      this.logger.info('Received SIGINT, shutting down gracefully');
      this.display('\n\nGoodbye!');
      this.close();
      process.exit(0);
    });
  }

  /**
   * Display a question and wait for user input
   */
  async prompt(message: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(message, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Display a general message to the user
   */
  display(message: string): void {
    console.log(message);
  }

  /**
   * Display an error message to the user
   */
  displayError(message: string): void {
    console.error(`❌ ${message}`);
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.rl.close();
  }
}
