import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { createScorer } from 'evalite';
import { traceAISDKModel } from 'evalite/ai-sdk';
import { createStorage } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs-lite';
import { z as z3 } from 'zod/v3';
import { cacheModel } from '@/evalite/cache-model.js';
import { AnswerRelevancyMetric } from '@/evalite/llm/answer-relevancy/index.js';
import { BiasMetric } from '@/evalite/llm/bias/index.js';
import { ContextPositionMetric } from '@/evalite/llm/context-position/index.js';
import { ContextPrecisionMetric } from '@/evalite/llm/context-precision/index.js';
import { ContextRelevancyMetric } from '@/evalite/llm/context-relevancy/index.js';
import { ContextualRecallMetric } from '@/evalite/llm/contextual-recall/index.js';
import { FaithfulnessMetric } from '@/evalite/llm/faithfulness/index.js';
import { HallucinationMetric } from '@/evalite/llm/hallucination/index.js';
import { PromptAlignmentMetric } from '@/evalite/llm/prompt-alignment/index.js';
import { SummarizationMetric } from '@/evalite/llm/summarization/index.js';
import { ToxicityMetric } from '@/evalite/llm/toxicity/index.js';
import { CompletenessMetric } from '@/evalite/nlp/completeness/index.js';
import { ContentSimilarityMetric } from '@/evalite/nlp/content-similarity/index.js';
import { KeywordCoverageMetric } from '@/evalite/nlp/keyword-coverage/index.js';
import { TextualDifferenceMetric } from '@/evalite/nlp/textual-difference/index.js';
import { ToneConsistencyMetric } from '@/evalite/nlp/tone-consistency/index.js';
import { getFactualityPrompt } from '@/evalite/prompts.js';

const storage = createStorage({
  // @ts-expect-error This expression is not callable. Type 'typeof import("/Users/rizeki.rifandani/Desktop/dev/nodejs/ai-monorepo/node_modules/unstorage/drivers/fs-lite")' has no call signatures.
  driver: fsDriver({
    base: '.evalite',
  }),
});

const model = traceAISDKModel(
  cacheModel(google('gemini-2.0-flash-001'), storage)
);

// #region LLM
export const AnswerRelevancy = createScorer<string, string, string>({
  name: 'AnswerRelevancy',
  scorer: async ({ input, output }) => {
    const answerRelevancyMetric = new AnswerRelevancyMetric(model);
    const { score, info } = await answerRelevancyMetric.measure(input, output);

    return {
      score,
      metadata: {
        rationale: info.reason,
      },
    };
  },
});

export const Bias = createScorer<string, string, string>({
  name: 'Bias',
  scorer: async ({ input, output }) => {
    const biasMetric = new BiasMetric(model);
    const { score, info } = await biasMetric.measure(input, output);

    return {
      score,
      metadata: {
        rationale: info.reason,
      },
    };
  },
});

export const ContextPosition = (retrievalContext: string[]) => {
  createScorer<string, string, string>({
    name: 'ContextPosition',
    scorer: async ({ input, output }) => {
      const contextPositionMetric = new ContextPositionMetric(model, {
        context: retrievalContext,
      });
      const { score, info } = await contextPositionMetric.measure(
        input,
        output
      );

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const ContextPrecision = (retrievalContext: string[]) => {
  createScorer<string, string, string>({
    name: 'ContextPrecision',
    scorer: async ({ input, output }) => {
      const contextPrecisionMetric = new ContextPrecisionMetric(model, {
        context: retrievalContext,
      });
      const { score, info } = await contextPrecisionMetric.measure(
        input,
        output
      );

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const ContextRelevancy = (retrievalContext: string[]) => {
  createScorer<string, string, string>({
    name: 'ContextRelevancy',
    scorer: async ({ input, output }) => {
      const contextRelevancyMetric = new ContextRelevancyMetric(model, {
        context: retrievalContext,
      });
      const { score, info } = await contextRelevancyMetric.measure(
        input,
        output
      );

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const ContextualRecall = (retrievalContext: string[]) => {
  createScorer<string, string, string>({
    name: 'ContextualRecall',
    scorer: async ({ input, output }) => {
      const contextualRecallMetric = new ContextualRecallMetric(model, {
        context: retrievalContext,
      });
      const { score, info } = await contextualRecallMetric.measure(
        input,
        output
      );

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const Faithfulness = (retrievalContext: string[]) => {
  createScorer<string, string, string>({
    name: 'Faithfulness',
    scorer: async ({ input, output }) => {
      const faithfulnessMetric = new FaithfulnessMetric(model, {
        context: retrievalContext,
      });
      const { score, info } = await faithfulnessMetric.measure(input, output);

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const Hallucination = (retrievalContext: string[]) => {
  createScorer<string, string, string>({
    name: 'Hallucination',
    scorer: async ({ input, output }) => {
      const hallucinationMetric = new HallucinationMetric(model, {
        context: retrievalContext,
      });
      const { score, info } = await hallucinationMetric.measure(input, output);

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const PromptAlignment = (instructions: string[]) => {
  createScorer<string, string, string>({
    name: 'PromptAlignment',
    scorer: async ({ input, output }) => {
      const promptAlignmentMetric = new PromptAlignmentMetric(model, {
        instructions,
      });
      const { score, info } = await promptAlignmentMetric.measure(
        input,
        output
      );

      return {
        score,
        metadata: {
          rationale: info.reason,
        },
      };
    },
  });
};

export const Summarization = createScorer<string, string, string>({
  name: 'Summarization',
  scorer: async ({ input, output }) => {
    const summarizationMetric = new SummarizationMetric(model);
    const { score, info } = await summarizationMetric.measure(input, output);

    return {
      score,
      metadata: {
        rationale: info.reason,
      },
    };
  },
});

export const Toxicity = createScorer<string, string, string>({
  name: 'Toxicity',
  scorer: async ({ input, output }) => {
    const toxicityMetric = new ToxicityMetric(model);
    const { score, info } = await toxicityMetric.measure(input, output);

    return {
      score,
      metadata: {
        rationale: info.reason,
      },
    };
  },
});
// #endregion LLM

// #region NLP
export const Completeness = createScorer<string, string, string>({
  name: 'Completeness',
  scorer: ({ input, output }) => {
    const completenessMetric = new CompletenessMetric();
    const { score, info } = completenessMetric.measure(input, output);

    return {
      score,
      metadata: info,
    };
  },
});

export const ContentSimilarity = createScorer<string, string, string>({
  name: 'ContentSimilarity',
  scorer: ({ input, output }) => {
    const contentSimilarityMetric = new ContentSimilarityMetric();
    const { score, info } = contentSimilarityMetric.measure(input, output);

    return {
      score,
      metadata: info,
    };
  },
});

export const KeywordCoverage = createScorer<string, string, string>({
  name: 'KeywordCoverage',
  scorer: ({ input, output }) => {
    const keywordCoverageMetric = new KeywordCoverageMetric();
    const { score, info } = keywordCoverageMetric.measure(input, output);

    return {
      score,
      metadata: info,
    };
  },
});

export const TextualDifference = createScorer<string, string, string>({
  name: 'TextualDifference',
  scorer: ({ input, output }) => {
    const textualDifferenceMetric = new TextualDifferenceMetric();
    const { score, info } = textualDifferenceMetric.measure(input, output);

    return {
      score,
      metadata: info,
    };
  },
});

export const ToneConsistency = createScorer<string, string, string>({
  name: 'ToneConsistency',
  scorer: ({ input, output }) => {
    const toneConsistencyMetric = new ToneConsistencyMetric();
    const { score, info } = toneConsistencyMetric.measure(input, output);

    return {
      score,
      metadata: info,
    };
  },
});
// #endregion NLP

export const Factuality = createScorer<string, string, string>({
  name: 'Factuality',
  scorer: async ({ input, expected, output }) => {
    const { object } = await generateObject({
      model: traceAISDKModel(
        cacheModel(google('gemini-2.0-flash-001'), storage)
      ),
      prompt: getFactualityPrompt(input, expected ?? '', output),
      schema: z3.object({
        answer: z3.enum(['A', 'B', 'C', 'D', 'E']).describe('Your selection.'),
        rationale: z3
          .string()
          .describe('Why you chose this answer. Be very detailed.'),
      }),
    });

    /**
     * LLM's are well documented at being poor at generating
     */
    const scores: Record<typeof object.answer, number> = {
      A: 0.4,
      B: 0.6,
      C: 1,
      D: 0,
      E: 1,
    };

    return {
      score: scores[object.answer],
      metadata: {
        rationale: object.rationale,
      },
    };
  },
});
