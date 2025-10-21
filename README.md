# CLI Questionnaire Engine

A flexible, CLI-based questionnaire engine that prompts users with configurable questions, supports conditional logic, validates responses, and provides session summaries. Built with TypeScript and Node.js.

## Features

- **Configurable Questions**: Define questionnaires in JSON format
- **Multiple Question Types**: Support for text input, yes/no, and multiple-choice questions
- **Conditional Logic**: Show/hide questions based on previous answers
- **Response Validation**: Type-specific validation with clear error messages
- **Cyclic Sessions**: Complete multiple questionnaires without restarting
- **Session Summaries**: View all responses at the end of each session
- **Graceful Error Handling**: User-friendly error messages and recovery

## Quick Start

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will load the questionnaire from `questionnaire.json` and begin prompting you with questions.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Usage

When you start the application, you'll be guided through a series of questions. After completing a questionnaire session, you'll see a summary of your responses and be prompted to either start a new session or exit.

### Example Session

```text
=== Pet Ownership Survey ===

Question 1: What is your name?
> John Doe

Question 2: Do you have a pet? (yes/no)
> yes

Question 3: What kind of pet do you have?
  1. Dog
  2. Cat
  3. Bird
  4. Other
> 1

=== Session Summary ===
1. What is your name? → John Doe
2. Do you have a pet? → yes
3. What kind of pet do you have? → Dog

Would you like to start a new session? (yes/no)
> no

Thank you for using the Questionnaire Engine!
```

## Configuration Format

The questionnaire is defined in `questionnaire.json` in the project root. The configuration follows this structure:

```json
{
  "title": "Questionnaire Title",
  "questions": [
    {
      "id": "unique_question_id",
      "text": "Question text to display",
      "type": "text | yesno | multiple-choice",
      "choices": ["Option 1", "Option 2"],
      "condition": {
        "questionId": "previous_question_id",
        "expectedAnswer": ["yes", "y"]
      }
    }
  ]
}
```

### Configuration Fields

- **title** (required): The title of the questionnaire, displayed at the start of each session
- **questions** (required): Array of question objects

### Question Object Fields

- **id** (required): Unique identifier for the question (used for conditional logic)
- **text** (required): The question text to display to the user
- **type** (required): The question type - one of: `text`, `yesno`, or `multiple-choice`
- **choices** (conditional): Array of choice strings (required only for `multiple-choice` type)
- **condition** (optional): Conditional display logic object

### Question Types

#### Text Input

Accepts any non-empty string input.

```json
{
  "id": "name",
  "text": "What is your name?",
  "type": "text"
}
```

#### Yes/No

Accepts "yes", "no", "y", or "n" (case-insensitive).

```json
{
  "id": "has_pet",
  "text": "Do you have a pet?",
  "type": "yesno"
}
```

#### Multiple Choice

Presents numbered options and accepts the number or exact text of a choice.

```json
{
  "id": "pet_type",
  "text": "What kind of pet do you have?",
  "type": "multiple-choice",
  "choices": ["Dog", "Cat", "Bird", "Other"]
}
```

### Conditional Questions

Questions can be conditionally displayed based on previous answers using the `condition` field:

- **questionId**: The ID of the question whose answer determines if this question is shown
- **expectedAnswer**: The answer(s) that trigger this question to be displayed (can be a string or array of strings)

If a question has no `condition` field, it will always be displayed.

#### Example: Conditional Question

```json
{
  "id": "pet_name",
  "text": "What is your pet's name?",
  "type": "text",
  "condition": {
    "questionId": "has_pet",
    "expectedAnswer": ["yes", "y"]
  }
}
```

This question will only be shown if the user answered "yes" or "y" to the "has_pet" question.

### Complete Example

See `questionnaire.json` for a complete example with all question types and conditional logic.

## Architecture

The application follows a modular, layered architecture with clear separation of concerns:

```text
┌─────────────────────────────────────────────────────────┐
│                      Main Entry Point                    │
│                    (Orchestration Layer)                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Questionnaire Engine                    │
│              (Core Business Logic Layer)                 │
│  - Session Management                                    │
│  - Question Flow Control                                 │
│  - Response Collection                                   │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Config       │   │ User Input   │   │ Validator    │
│ Loader       │   │ Handler      │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Condition    │   │ Logger       │   │ Types        │
│ Evaluator    │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

### Core Components

#### 1. ConfigLoader (`src/config-loader.ts`)

Loads and parses the questionnaire configuration from JSON files.

- Reads configuration file from disk
- Validates configuration structure
- Provides clear error messages for malformed configs

#### 2. ResponseValidator (`src/validator.ts`)

Validates user input based on question type.

- Text validation: Non-empty strings
- Yes/No validation: Accepts y/n/yes/no (case-insensitive)
- Multiple-choice validation: Matches against defined choices
- Returns descriptive error messages

#### 3. UserInputHandler (`src/user-input-handler.ts`)

Manages CLI interaction with the user.

- Displays questions and prompts
- Reads user input from stdin
- Displays error messages and summaries
- Handles graceful shutdown (Ctrl+C)

#### 4. ConditionEvaluator (`src/condition-evaluator.ts`)

Evaluates conditional logic for question display.

- Checks if questions have display conditions
- Evaluates conditions against previous responses
- Supports exact match and array-based conditions
- Handles missing responses gracefully

#### 5. QuestionnaireEngine (`src/engine.ts`)

Orchestrates the questionnaire session flow.

- Manages session lifecycle
- Iterates through questions sequentially
- Evaluates conditions for each question
- Collects and validates responses
- Generates session summaries

#### 6. Main Application (`src/main.ts`)

Entry point and application lifecycle management.

- Initializes all dependencies
- Runs cyclic session loop
- Handles user choice to continue or exit
- Manages graceful shutdown and error handling

### Design Decisions

#### Dependency Injection

All components receive their dependencies through constructors, making the code:

- Easier to test (can inject mocks)
- More flexible (can swap implementations)
- More maintainable (clear dependencies)

#### Type Safety

TypeScript is used throughout for compile-time safety:

- Interfaces define clear contracts
- Type checking prevents runtime errors
- Better IDE support and autocomplete

#### Single Responsibility Principle

Each component has one clear purpose:

- ConfigLoader only loads configuration
- Validator only validates responses
- Engine only orchestrates flow

#### Error Handling Strategy

- **Configuration Errors**: Display clear message and exit with code 1
- **Validation Errors**: Display error and re-prompt for same question
- **System Errors**: Log full error, display user-friendly message, exit gracefully

#### Testability

Components are designed to be easily unit testable:

- Pure functions where possible
- Dependency injection for mocking
- Clear input/output contracts

## Testing

The project includes comprehensive unit tests for all core components.

### Test Structure

```text
tests/
├── config-loader.test.ts       # Configuration loading tests
├── validator.test.ts           # Response validation tests
├── condition-evaluator.test.ts # Conditional logic tests
├── user-input-handler.test.ts  # CLI interaction tests
└── engine.test.ts              # Engine orchestration tests
```

### Test Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:

- **ConfigLoader**: Valid/invalid JSON, missing files, schema validation
- **ResponseValidator**: All question types, edge cases, error messages
- **ConditionEvaluator**: Various condition scenarios, missing responses
- **UserInputHandler**: Mocked readline interactions, display methods
- **QuestionnaireEngine**: Full session flow, conditional skipping, validation retry

### Writing Tests

Tests use Vitest as the testing framework. Example test structure:

```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should handle expected behavior', () => {
    // Arrange
    const component = new Component();

    // Act
    const result = component.method();

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## Project Structure

```text
.
├── src/
│   ├── config-loader.ts        # Configuration file loader
│   ├── condition-evaluator.ts  # Conditional logic evaluator
│   ├── engine.ts               # Core questionnaire engine
│   ├── logger.ts               # Logging utility
│   ├── main.ts                 # Application entry point
│   ├── types.ts                # TypeScript type definitions
│   ├── user-input-handler.ts   # CLI interaction handler
│   └── validator.ts            # Response validator
├── tests/
│   ├── config-loader.test.ts
│   ├── condition-evaluator.test.ts
│   ├── engine.test.ts
│   ├── user-input-handler.test.ts
│   └── validator.test.ts
├── questionnaire.json          # Sample questionnaire configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

The project uses minimal external dependencies:

- **TypeScript**: Type safety and modern JavaScript features
- **Vitest**: Fast unit testing framework
- **Node.js built-ins**: `fs`, `readline` for core functionality

No external libraries are required for the core questionnaire functionality, keeping the project lightweight and maintainable.

## Future Enhancements

Potential improvements for future versions:

- YAML configuration file support
- Answer persistence (save/load sessions)
- Export session results to JSON/CSV
- More complex conditional logic (AND/OR operators)
- Question branching (skip to specific question)
- Input history and editing
- Internationalization support
- Web-based UI option

## License

MIT
