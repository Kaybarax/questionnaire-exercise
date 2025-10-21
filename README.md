# Heartbeat Engineering Exercise

> 🚨 Please fork the repository and complete the exercise in your forked **private** repository. 
> Once completed, please invite us to your repository.

Thank you for your interest in Heartbeat! We are excited to see your skills in action through this engineering exercise.
This exercise is designed to assess your coding skills, problem-solving abilities, and understanding of software development 
best practices. Please read the instructions carefully and complete the tasks as specified.


## Overview

This repository contains a simple node CLI application. It includes a few basic commands and a simple file structure.

```
├── src/
│   ├── engine.ts
│   ├── logger.ts
│   └── main.ts
├── tests/
│   └── engine.test.ts
```
The general structure of the files doesn't need to be changed, but feel free to add any additional files 
or folders as needed.

## Task

Build a CLI-based Questionnaire engine that prompts users with a series of questions and records their answers. 
A questionnaire session should be completed with a summary of the user's responses.

### Requirements

- The application question-set should be configurable with configuration file (e.g., JSON or YAML).
- Questions should be sequentially presented to the user.
- Questions can be conditionally shown based on previous answers. (for example, Do you have a pet? If yes, ask what kind of pet)
- The program should be cyclic. (i.e., after completing a questionnaire, the user should be able to start a new one without restarting the application).
- Document your chosen architecture and design decisions.
- Errors should, of course, be handled gracefully.

### Bonus Points

- Questions can have different types and corresponding validation (e.g., multiple-choice, text input, yes/no).
- Include unit tests for your code.


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

### Question Types

- **text**: Accepts any non-empty string input
- **yesno**: Accepts "yes", "no", "y", or "n" (case-insensitive)
- **multiple-choice**: Accepts one of the predefined choices (requires `choices` array)

### Conditional Questions

Questions can be conditionally displayed based on previous answers:

- `condition.questionId`: The ID of the question whose answer determines if this question is shown
- `condition.expectedAnswer`: The answer(s) that trigger this question to be displayed (can be a string or array of strings)

If a question has no `condition` field, it will always be displayed.

### Example

See `questionnaire.json` for a complete example with text, yes/no, and multiple-choice questions, including conditional logic.

## Submission

### Time

> We expect you to spend no more than 4 hours on this exercise. Please prioritize quality over quantity. If you can't complete all tasks/requirements, let us know in your submission how you would extend it.

### External assistance

- You may use external utility libraries if it helps you speed things up. Do share your reasoning if you decide to share something uncommon.
- We expect you to write the core logic yourself. You can use internet search or LLMs to clarify concepts or get unstuck, but please do not get the AI to write the code for you.
As it is obvious, it defeats the purpose of the exercise and would disqualify your submission.

### Process

1. Create a private fork of this repository
2. Create a new branch in your fork
3. Commit on that branch
4. When you are ready to submit, create a PR back to your fork
5. Add the user @heartbeat-med (https://github.com/heartbeat-med)
6. We will comment on the PR
7. You can either submit more code or we can discuss in the next interview
8. Any questions, reach out to us!
