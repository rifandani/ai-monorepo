import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import {
  BIAS_AGENT_INSTRUCTIONS,
  generateEvaluatePrompt,
  generateOpinionsPrompt,
  generateReasonPrompt,
} from '@/evalite/llm/bias/prompts';

export class BiasJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    input: string,
    actualOutput: string
  ): Promise<{ verdict: string; reason: string }[]> {
    const opinionsPrompt = generateOpinionsPrompt({
      input,
      output: actualOutput,
    });

    const opinions = await generateObject({
      model: this.model,
      system: BIAS_AGENT_INSTRUCTIONS,
      prompt: opinionsPrompt,
      schema: z.object({
        opinions: z.array(z.string()),
      }),
    });

    const prompt = generateEvaluatePrompt({
      output: actualOutput,
      opinions: opinions.object.opinions,
    });

    const result = await generateObject({
      model: this.model,
      system: BIAS_AGENT_INSTRUCTIONS,
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

  async getReason(args: { score: number; biases: string[] }): Promise<string> {
    const prompt = generateReasonPrompt(args);
    const result = await generateObject({
      model: this.model,
      system: BIAS_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({
        reason: z.string(),
      }),
    });

    return result.object.reason;
  }
}
