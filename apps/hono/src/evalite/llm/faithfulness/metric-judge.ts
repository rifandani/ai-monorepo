import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import {
  FAITHFULNESS_AGENT_INSTRUCTIONS,
  generateClaimExtractionPrompt,
  generateEvaluatePrompt,
  generateReasonPrompt,
} from '@/evalite/llm/faithfulness/prompts.js';

export class FaithfulnessJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    output: string,
    context: string[]
  ): Promise<{ claim: string; verdict: string; reason: string }[]> {
    const claimsPrompt = generateClaimExtractionPrompt({ output });
    const claims = await generateObject({
      model: this.model,
      system: FAITHFULNESS_AGENT_INSTRUCTIONS,
      prompt: claimsPrompt,
      schema: z.object({
        claims: z.array(z.string()),
      }),
    });

    if (claims.object.claims.length === 0) {
      return [];
    }

    const evaluatePrompt = generateEvaluatePrompt({
      claims: claims.object.claims,
      context,
    });
    const result = await generateObject({
      model: this.model,
      system: FAITHFULNESS_AGENT_INSTRUCTIONS,
      prompt: evaluatePrompt,
      schema: z.object({
        verdicts: z.array(
          z.object({
            claim: z.string(),
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
    context: string[];
    score: number;
    scale: number;
    verdicts: { verdict: string; reason: string }[];
  }): Promise<string> {
    const prompt = generateReasonPrompt(args);
    const result = await generateObject({
      model: this.model,
      system: FAITHFULNESS_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({
        reason: z.string(),
      }),
    });
    return result.object.reason;
  }
}
