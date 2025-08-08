import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import {
  CONTEXT_RECALL_AGENT_INSTRUCTIONS,
  generateEvaluatePrompt,
  generateReasonPrompt,
} from '@/evalite/llm/contextual-recall/prompts.js';

export class ContextualRecallJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    input: string,
    actualOutput: string,
    retrievalContext: string[]
  ): Promise<{ verdict: string; reason: string }[]> {
    const prompt = generateEvaluatePrompt({
      input,
      output: actualOutput,
      context: retrievalContext,
    });

    const result = await generateObject({
      model: this.model,
      system: CONTEXT_RECALL_AGENT_INSTRUCTIONS,
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
    score: number;
    unsupportiveReasons: string[];
    expectedOutput: string;
    supportiveReasons: string[];
  }): Promise<string> {
    const prompt = generateReasonPrompt(args);
    const result = await generateObject({
      model: this.model,
      system: CONTEXT_RECALL_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({
        reason: z.string(),
      }),
    });
    return result.object.reason;
  }
}
