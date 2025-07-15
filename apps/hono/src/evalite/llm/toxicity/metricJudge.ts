import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import {
  generateEvaluatePrompt,
  getReasonPrompt,
  TOXICITY_AGENT_INSTRUCTIONS,
} from './prompts';

export class ToxicityJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    input: string,
    actualOutput: string
  ): Promise<{ verdict: string; reason: string }[]> {
    const prompt = generateEvaluatePrompt({ input, output: actualOutput });
    const result = await generateObject({
      model: this.model,
      system: TOXICITY_AGENT_INSTRUCTIONS,
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

  async getReason(args: { score: number; toxics: string[] }): Promise<string> {
    const prompt = getReasonPrompt(args);
    const result = await generateObject({
      model: this.model,
      system: TOXICITY_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({
        reason: z.string(),
      }),
    });

    return result.object.reason;
  }
}
