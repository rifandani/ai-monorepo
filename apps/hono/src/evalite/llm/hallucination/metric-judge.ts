import { generateObject, type LanguageModel } from 'ai';
import { z } from 'zod/v3';
import { generateClaimExtractionPrompt } from '@/evalite/llm/faithfulness/prompts.js';
import {
  generateEvaluatePrompt,
  generateReasonPrompt,
  HALLUCINATION_AGENT_INSTRUCTIONS,
} from '@/evalite/llm/hallucination/prompts.js';

export class HallucinationJudge {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async evaluate(
    output: string,
    context: string[]
  ): Promise<{ statement: string; verdict: string; reason: string }[]> {
    const claimsPrompt = generateClaimExtractionPrompt({ output });
    const claims = await generateObject({
      model: this.model,
      system: HALLUCINATION_AGENT_INSTRUCTIONS,
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
      system: HALLUCINATION_AGENT_INSTRUCTIONS,
      prompt: evaluatePrompt,
      schema: z.object({
        verdicts: z.array(
          z.object({
            statement: z.string(),
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
      system: HALLUCINATION_AGENT_INSTRUCTIONS,
      prompt,
      schema: z.object({ reason: z.string() }),
    });
    return result.object.reason;
  }
}
