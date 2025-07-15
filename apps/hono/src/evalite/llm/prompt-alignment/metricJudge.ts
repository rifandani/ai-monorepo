import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import {
  generateEvaluatePrompt,
  generateReasonPrompt,
  PROMPT_ALIGNMENT_AGENT_INSTRUCTIONS,
} from '@/evalite/llm/prompt-alignment/prompts';

export class PromptAlignmentJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    input: string,
    actualOutput: string,
    instructions: string[]
  ): Promise<{ verdict: string; reason: string }[]> {
    const prompt = generateEvaluatePrompt({
      input,
      output: actualOutput,
      instructions,
    });
    const result = await generateObject({
      model: this.model,
      system: PROMPT_ALIGNMENT_AGENT_INSTRUCTIONS,
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
    verdicts: { verdict: string; reason: string }[];
    scale: number;
  }): Promise<string> {
    const prompt = generateReasonPrompt(args);
    const result = await generateObject({
      model: this.model,
      system: PROMPT_ALIGNMENT_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({ reason: z.string() }),
    });
    return result.object.reason;
  }
}
