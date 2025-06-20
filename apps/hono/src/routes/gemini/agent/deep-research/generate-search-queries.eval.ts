import { cacheModel } from '@/evalite/cache-model';
import { generateSearchQueries } from '@/routes/gemini/agent/deep-research/deep-research';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { createScorer, evalite } from 'evalite';
import { traceAISDKModel } from 'evalite/ai-sdk';
import { createStorage } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs';
import { z } from 'zod';

type Input = {
  query: string;
  depth: number;
};

const storage = createStorage({
  driver: fsDriver({
    base: '.evalite',
  }),
});

// Scorer for quality assessment
const SearchQueryQuality = createScorer<Input, string>({
  name: 'SearchQueryQuality',
  scorer: async ({ input, output }) => {
    const { object } = await generateObject({
      model: traceAISDKModel(
        cacheModel(google('gemini-2.0-flash-001'), storage)
      ),
      prompt: `You are an expert in information retrieval and search query optimization. 
Evaluate the quality of these generated search queries for the given topic.

Topic: ${input.query}.
Depth requested: ${input.depth}.
Generated queries: ${output}.

Rate the search queries based on:
1. Relevance to the topic
2. Diversity (covering different aspects)
3. Specificity (not too broad, not too narrow)
4. Likely to return useful results
5. Good coverage for the requested depth

Decide the quality of the queries and rate them accordingly:
- excellent_quality: High-quality, diverse, relevant queries that would yield comprehensive results
- good_quality: Solid queries with minor issues
- fair_quality: Adequate but could be improved
- poor_quality: Low quality, irrelevant, or poorly constructed queries`,
      schema: z.object({
        rating: z
          .enum([
            'excellent_quality',
            'good_quality',
            'fair_quality',
            'poor_quality',
          ])
          .describe('Your rating selection.'),
        rationale: z
          .string()
          .describe('Why you chose this rating. Be very detailed.'),
      }),
    });

    const scores: Record<typeof object.rating, number> = {
      excellent_quality: 1.0,
      good_quality: 0.75,
      fair_quality: 0.5,
      poor_quality: 0.25,
    };

    return {
      score: scores[object.rating],
      metadata: {
        rationale: object.rationale,
      },
    };
  },
});

// Scorer for diversity assessment
const SearchQueryDiversity = createScorer<Input, string>({
  name: 'SearchQueryDiversity',
  scorer: async ({ input, output }) => {
    const { object } = await generateObject({
      model: traceAISDKModel(
        cacheModel(google('gemini-2.0-flash-001'), storage)
      ),
      prompt: `You are an expert in search query optimization.
Evaluate the diversity of these search queries for the given topic.

Topic: ${input.query}.
Generated queries: ${output}.

Decide if the queries cover different aspects and angles of the topic and rate them accordingly:
- excellent_diversity: Queries explore multiple distinct facets and perspectives with comprehensive coverage
- good_diversity: Queries cover several different aspects with good variety
- fair_diversity: Queries have some variety but with overlap or missing key aspects
- poor_diversity: Queries are repetitive or cover very limited scope`,
      schema: z.object({
        rating: z
          .enum([
            'excellent_diversity',
            'good_diversity',
            'fair_diversity',
            'poor_diversity',
          ])
          .describe('Your rating selection.'),
        rationale: z
          .string()
          .describe('Why you chose this rating. Be very detailed.'),
      }),
    });

    const scores: Record<typeof object.rating, number> = {
      excellent_diversity: 1.0,
      good_diversity: 0.75,
      fair_diversity: 0.5,
      poor_diversity: 0.25,
    };

    return {
      score: scores[object.rating],
      metadata: {
        rationale: object.rationale,
      },
    };
  },
});

// Scorer for query count validation
const SearchQueryCount = createScorer<Input, string>({
  name: 'SearchQueryCount',
  scorer: async ({ input, output }) => {
    const queryCount = output.split('\n').filter((line) => line.trim()).length;

    // Score based on whether we got the expected number of queries
    const score = queryCount >= input.depth ? 1.0 : queryCount / input.depth;

    return {
      score,
      metadata: {
        expected_count: input.depth,
        actual_count: queryCount,
        meets_expectation: queryCount >= input.depth,
      },
    };
  },
});

evalite('generateSearchQueries', {
  data: async () => [
    {
      input: {
        query: 'Electric Cars',
        depth: 1,
      },
      // No expected value needed for LLM-based evaluation
    },
    // {
    //   input: {
    //     query: 'Artificial Intelligence in Healthcare',
    //     depth: 2,
    //   },
    // },
    // {
    //   input: {
    //     query: 'Climate Change Impact on Agriculture',
    //     depth: 3,
    //   },
    // },
  ],
  task: async ({ query, depth }) => {
    const queries = await generateSearchQueries(query, depth);
    // Format the queries nicely for evaluation
    return queries.map((q, i) => `${i + 1}. ${q}`).join('\n');
  },
  // LLM-Based Evaluation Instead of String Similarity (Levenshtein)
  scorers: [SearchQueryQuality, SearchQueryDiversity, SearchQueryCount],
});
