import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import {
  ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
  generateEvaluatePrompt,
  generateEvaluationStatementsPrompt,
  generateReasonPrompt,
} from '@/evalite/llm/answer-relevancy/prompts.js';

export class AnswerRelevancyJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    input: string,
    actualOutput: string
  ): Promise<{ verdict: string; reason: string }[]> {
    const statementPrompt = generateEvaluationStatementsPrompt({
      output: actualOutput,
    });
    const statements = await generateObject({
      model: this.model,
      system: ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
      prompt: statementPrompt,
      schema: z.object({
        statements: z.array(z.string()),
      }),
    });
    const prompt = generateEvaluatePrompt({
      input,
      statements: statements.object.statements,
    });
    const result = await generateObject({
      model: this.model,
      system: ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({
        verdicts: z.array(
          z.object({
            verdict: z.string(),
            reason: z.string(),
          })
        ),
      }),
    });

    return result.object.verdicts;
  }

  async getReason(args: {
    input: string;
    output: string;
    score: number;
    scale: number;
    verdicts: { verdict: string; reason: string }[];
  }): Promise<string> {
    const prompt = generateReasonPrompt(args);
    const result = await generateObject({
      model: this.model,
      system: ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({
        reason: z.string(),
      }),
    });

    return result.object.reason;
  }
}
