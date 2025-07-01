import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { createScorer, evalite } from 'evalite';
import { traceAISDKModel } from 'evalite/ai-sdk';
import { createStorage } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs';
import { z as z3 } from 'zod/v3';
import { cacheModel } from '@/evalite/cache-model';
import {
  type SearchResult,
  searchAndEvaluate,
} from '@/routes/gemini/agent/deep-research/deep-research';

type Input = {
  query: string;
  accumulatedSources: SearchResult[];
};

const storage = createStorage({
  driver: fsDriver({
    base: '.evalite',
  }),
});

// Scorer for relevance quality assessment
const SearchResultRelevance = createScorer<Input, SearchResult[]>({
  name: 'SearchResultRelevance',
  scorer: async ({ input, output }) => {
    const { object } = await generateObject({
      model: traceAISDKModel(
        cacheModel(google('gemini-2.0-flash-001'), storage)
      ),
      prompt: `You are an expert in information retrieval and search result evaluation.
Evaluate how relevant these search results are to the given query.

Query: "${input.query}"
Search Results: ${JSON.stringify(output, null, 2)}

Rate the relevance of the search results based on:
1. How well they answer or relate to the query
2. Whether they provide useful information for the topic
3. If they address the core intent of the search
4. Overall alignment with what a user would expect

Decide the relevance quality and rate accordingly:
- excellent_relevance: Highly relevant results that directly address the query
- good_relevance: Mostly relevant with some useful information
- fair_relevance: Somewhat relevant but could be better aligned
- poor_relevance: Low relevance or off-topic results`,
      schema: z3.object({
        rating: z3
          .enum([
            'excellent_relevance',
            'good_relevance',
            'fair_relevance',
            'poor_relevance',
          ])
          .describe('Your relevance rating selection.'),
        rationale: z3
          .string()
          .describe('Why you chose this rating. Be very detailed.'),
      }),
    });

    const scores: Record<typeof object.rating, number> = {
      excellent_relevance: 1.0,
      good_relevance: 0.75,
      fair_relevance: 0.5,
      poor_relevance: 0.25,
    };

    return {
      score: scores[object.rating],
      metadata: {
        rationale: object.rationale,
        result_count: output.length,
      },
    };
  },
});

// Scorer for content quality assessment
const SearchResultContentQuality = createScorer<Input, SearchResult[]>({
  name: 'SearchResultContentQuality',
  scorer: async ({ input, output }) => {
    const { object } = await generateObject({
      model: traceAISDKModel(
        cacheModel(google('gemini-2.0-flash-001'), storage)
      ),
      prompt: `You are an expert content evaluator.
Evaluate the quality of content in these search results.

Query: "${input.query}"
Search Results: ${JSON.stringify(output, null, 2)}

Rate the content quality based on:
1. Depth and detail of information provided
2. Accuracy and credibility of the content
3. Completeness of information
4. Whether the content is substantive (not just titles/snippets)
5. Overall informativeness

Decide the content quality and rate accordingly:
- excellent_content: Rich, detailed, comprehensive content
- good_content: Solid content with good depth
- fair_content: Adequate content but could be more detailed
- poor_content: Shallow, incomplete, or low-quality content`,
      schema: z3.object({
        rating: z3
          .enum([
            'excellent_content',
            'good_content',
            'fair_content',
            'poor_content',
          ])
          .describe('Your content quality rating selection.'),
        rationale: z3
          .string()
          .describe('Why you chose this rating. Be very detailed.'),
      }),
    });

    const scores: Record<typeof object.rating, number> = {
      excellent_content: 1.0,
      good_content: 0.75,
      fair_content: 0.5,
      poor_content: 0.25,
    };

    return {
      score: scores[object.rating],
      metadata: {
        rationale: object.rationale,
        average_content_length:
          output.length > 0
            ? Math.round(
                output.reduce((sum, result) => sum + result.content.length, 0) /
                  output.length
              )
            : 0,
      },
    };
  },
});

// Scorer for duplicate avoidance assessment
const DuplicateAvoidance = createScorer<Input, SearchResult[]>({
  name: 'DuplicateAvoidance',
  scorer: async ({ input, output }) => {
    const accumulatedUrls = input.accumulatedSources.map(
      (source) => source.url
    );
    const outputUrls = output.map((result) => result.url);

    // Check for exact URL duplicates
    const exactDuplicates = outputUrls.filter((url) =>
      accumulatedUrls.includes(url)
    );

    // Use LLM to check for semantic duplicates (same content, different URLs)
    const { object } = await generateObject({
      model: traceAISDKModel(
        cacheModel(google('gemini-2.0-flash-001'), storage)
      ),
      prompt: `You are an expert at detecting duplicate content.
Analyze if any of the new search results are semantically duplicate to the accumulated sources.

Accumulated Sources: ${JSON.stringify(input.accumulatedSources, null, 2)}
New Results: ${JSON.stringify(output, null, 2)}

Look for:
1. Same or very similar content
2. Same information from different sources
3. Redundant information that doesn't add value

Rate the duplicate avoidance:
- excellent_avoidance: No duplicates, all results add unique value
- good_avoidance: Minimal duplicates, mostly unique content
- fair_avoidance: Some duplicates but acceptable
- poor_avoidance: Many duplicates or redundant content`,
      schema: z3.object({
        rating: z3
          .enum([
            'excellent_avoidance',
            'good_avoidance',
            'fair_avoidance',
            'poor_avoidance',
          ])
          .describe('Your duplicate avoidance rating.'),
        rationale: z3
          .string()
          .describe('Why you chose this rating. Be very detailed.'),
        semantic_duplicates_found: z3
          .number()
          .describe('Number of semantic duplicates found'),
      }),
    });

    const scores: Record<typeof object.rating, number> = {
      excellent_avoidance: 1.0,
      good_avoidance: 0.75,
      fair_avoidance: 0.5,
      poor_avoidance: 0.25,
    };

    return {
      score: scores[object.rating],
      metadata: {
        rationale: object.rationale,
        exact_duplicates: exactDuplicates.length,
        semantic_duplicates: object.semantic_duplicates_found,
        total_accumulated_sources: input.accumulatedSources.length,
        new_results_count: output.length,
      },
    };
  },
});

// Scorer for result count validation
const SearchResultCount = createScorer<Input, SearchResult[]>({
  name: 'SearchResultCount',
  scorer: ({ input, output }) => {
    const resultCount = output.length;

    // Ideal range is 1-5 results per query
    let score: number;
    if (resultCount === 0) {
      score = 0.0; // No results is poor
    } else if (resultCount >= 1 && resultCount <= 3) {
      score = 1.0; // Optimal range
    } else if (resultCount <= 5) {
      score = 0.8; // Good range
    } else if (resultCount <= 10) {
      score = 0.6; // Acceptable but getting too many
    } else {
      score = 0.3; // Too many results
    }

    return {
      score,
      metadata: {
        result_count: resultCount,
        is_optimal_range: resultCount >= 1 && resultCount <= 3,
        query_length: input.query.length,
      },
    };
  },
});

evalite('searchAndEvaluate', {
  data: async () => [
    {
      input: {
        query: 'Latest developments in electric vehicle battery technology',
        accumulatedSources: [],
      },
    },
    {
      input: {
        query: 'Climate change impact on agriculture',
        accumulatedSources: [
          {
            title:
              'Global Warming Effects on Crop Yields: A Comprehensive Analysis',
            content:
              'Climate change is significantly affecting agricultural productivity worldwide, with rising temperatures, changing precipitation patterns, and increased frequency of extreme weather events. Studies show that global crop yields could decline by 10-25% by 2050 if current trends continue. Farmers are already adapting through crop diversification, improved irrigation systems, and climate-smart agricultural practices. The economic impact extends beyond farming communities, affecting global food security and commodity prices.',
            url: 'https://www.nature.com/articles/s41558-023-01644-1',
          },
        ],
      },
    },
    {
      input: {
        query: 'Artificial intelligence applications in healthcare',
        accumulatedSources: [
          {
            title: 'AI in Medical Diagnosis: Revolutionizing Patient Care',
            content:
              'Machine learning algorithms are revolutionizing medical diagnosis across multiple specialties. Deep learning models trained on vast datasets of medical images can now detect cancers, cardiovascular diseases, and neurological conditions with accuracy rates exceeding 95% in some cases. These AI systems can analyze CT scans, MRIs, and X-rays faster than human radiologists while maintaining high precision. The technology is particularly valuable in rural areas with limited access to specialist care, enabling early detection and improved patient outcomes.',
            url: 'https://www.thelancet.com/journals/landig/article/PIIS2589-7500(23)00123-8',
          },
          {
            title:
              'Healthcare AI Ethics: Balancing Innovation with Patient Safety',
            content:
              'The ethical implications of AI in healthcare are complex and multifaceted. Key concerns include algorithmic bias that could perpetuate healthcare disparities, transparency in decision-making processes, and maintaining patient privacy while training AI systems on sensitive medical data. Regulatory frameworks are evolving to address these challenges, with organizations like the FDA implementing guidelines for AI-powered medical devices. The balance between innovation and safety remains crucial as healthcare systems increasingly adopt AI technologies.',
            url: 'https://www.nejm.org/doi/full/10.1056/NEJMra2302038',
          },
        ],
      },
    },
  ],
  task: async ({ query, accumulatedSources }) => {
    const results = await searchAndEvaluate(query, accumulatedSources);
    return results;
  },
  scorers: [
    SearchResultRelevance,
    SearchResultContentQuality,
    DuplicateAvoidance,
    SearchResultCount,
  ],
});
