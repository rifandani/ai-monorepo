import { models } from '@/core/api/ai';
import { recordSpan } from '@/core/utils/telemetry';
import { type AttributeValue, metrics, trace } from '@opentelemetry/api';
import { generateObject, generateText, tool } from 'ai';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import type { Variables } from 'hono/types';
import { crush } from 'radashi';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

const tracer = trace.getTracer('deepResearchEndpoint', '1.0.0');
const meter = metrics.getMeter('deepResearchEndpoint', '1.0.0');
const queriesCounter = meter.createCounter('deepResearch.queries');
const searchResultsCounter = meter.createCounter('deepResearch.searchResults');

const searchResultSchema = z.object({
  title: z.string().describe('The title of the search result'),
  content: z.string().describe('The content of the search result'),
  url: z.string().describe('The url of the search result source'),
});
type SearchResult = z.infer<typeof searchResultSchema>;

const learningSchema = z.object({
  learning: z.string().describe('The learning from the search result'),
  followUpQuestions: z
    .array(z.string())
    .describe('The follow-up questions from the search result'),
});

const researchSchema = z.object({
  query: z.string().optional().describe('The current query to research'),
  queries: z
    .array(z.string())
    .describe('The current relevant search queries based on query'),
  searchResults: z
    .array(searchResultSchema)
    .describe('The accumulated search results'),
  learnings: z.array(learningSchema).describe('The accumulated learnings'),
  completedQueries: z
    .array(z.string())
    .describe('The accumulated completed queries'),
});
type Research = z.infer<typeof researchSchema>;

const accumulatedResearch: Research = {
  query: undefined,
  queries: [],
  searchResults: [],
  learnings: [],
  completedQueries: [],
};

/**
 * e.g. Let's say we're researching "Electric Cars" with depth = 2 and breadth = 3
 *
 * Level 0 (Initial Query): "Electric Cars"
 * │
 * ├── Level 1 (depth = 1):
 * │   ├── Sub-query 1: "Tesla Model 3 specifications"
 * │   ├── Sub-query 2: "Electric car charging infrastructure"
 * │   └── Sub-query 3: "Electric vehicle battery technology"
 * │
 * └── Level 2 (depth = 2):
 *     ├── From Sub-query 1:
 *     │   ├── "Model 3 range capacity"
 *     │   └── "Model 3 pricing"
 *     │   └── "Model 3 battery life"
 *     │
 *     ├── From Sub-query 2:
 *     │   ├── "Fast charging stations in US"
 *     │   └── "Home charging installation"
 *     │   └── "How much does it cost to charge an electric car"
 *     │
 *     └── From Sub-query 3:
 *         ├── "Lithium ion battery lifespan"
 *         └── "Solid state batteries"
 *         └── "How long does it take to charge an electric car to full capacity"
 */
async function generateReport(research: Research) {
  // we can use reasoning model here to generate a comprehensive report
  const { text } = await generateText({
    model: models.flash25,
    system: `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.
  - Use Markdown formatting.`,
    prompt: `Generate a report based on the following research data:\n\n${JSON.stringify(research, null, 2)}`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateReport',
      metadata: crush({ research }) as Record<string, AttributeValue>,
    },
  });

  return text;
}

async function deepResearch(query: string, depth = 1, breadth = 2) {
  return await recordSpan({
    tracer,
    name: 'deepResearch',
    attributes: { query, depth, breadth },
    fn: async (span) => {
      // if the query is not set, set it
      if (!accumulatedResearch.query) {
        span.addEvent('Setting initial query', { query });
        accumulatedResearch.query = query;
      }

      // if depth is 0, return the accumulated research
      if (depth === 0) {
        span.addEvent(
          'Empty depth, return early',
          crush(accumulatedResearch) as Record<string, AttributeValue>
        );
        return accumulatedResearch;
      }

      const queries = await generateSearchQueries(query, depth);
      accumulatedResearch.queries = queries;

      // loop through the search queries (based on input depth)
      for (const query of queries) {
        queriesCounter.add(1);
        const searchResults = await searchAndEvaluate(
          query,
          accumulatedResearch.searchResults
        );
        accumulatedResearch.searchResults.push(...searchResults);

        for (const searchResult of searchResults) {
          searchResultsCounter.add(1);
          const learnings = await generateLearningAndFollowUpQuestions(
            query,
            searchResult
          );
          accumulatedResearch.learnings.push(learnings);
          accumulatedResearch.completedQueries.push(query);

          // call deepResearch recursively with decrementing depth and breadth
          await deepResearch(
            `Overall research goal: ${query}
        Previous search queries: ${accumulatedResearch.completedQueries.join(', ')}
        Follow-up questions: ${learnings.followUpQuestions.join(', ')}
        `,
            depth - 1,
            Math.ceil(breadth / 2)
          );
        }
      }

      span.setAttributes(
        crush({ accumulatedResearch }) as Record<string, AttributeValue>
      );
      return accumulatedResearch;
    },
  });
}

async function generateLearningAndFollowUpQuestions(
  query: string,
  searchResult: SearchResult
) {
  const { object } = await generateObject({
    model: models.flash25,
    prompt: `The user is researching "${query}". The following search result were deemed relevant.
    Generate a learning and a follow-up question from the following search result:
 
    <search_result>
    ${JSON.stringify(searchResult)}
    </search_result>
    `,
    schema: learningSchema,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateLearningAndFollowUpQuestions',
      metadata: crush({ query, searchResult }) as Record<
        string,
        AttributeValue
      >,
    },
  });

  return object;
}

async function searchAndEvaluate(
  query: string,
  accumulatedSources: SearchResult[]
) {
  const pendingSearchResults: SearchResult[] = [];
  const finalSearchResults: SearchResult[] = [];

  await generateText({
    model: models.flash25,
    system:
      'You are a researcher. For each query, search the web and then evaluate if the results are relevant and will help answer the following query',
    prompt: `Search the web for information about ${query}`,
    maxSteps: 10,
    tools: {
      searchWeb: tool({
        description: 'Search the web for information about a given query',
        parameters: z.object({
          query: z.string().min(1),
        }),
        async execute({ query }) {
          /**
           * we can't get real `sources` based on the search results using `experimental_output`
           * it throws an error: "ToolExecutionError: Error executing tool searchWeb: Unable to submit request because controlled generation is not supported with google_search tool"
           *
           * when we use generateObject, it works fine, but we can't get the real `sources`
           * even if we define url in the schema, the value is not real website (halucinated)
           */

          const {
            // sources,
            // experimental_output: { results },
            object: { results },
          } = await generateObject({
            model: models.flash20search,
            prompt: query,
            // experimental_output: Output.object({
            //   schema: z.object({
            //     results: z.array(searchResultSchema),
            //   }),
            // }),
            schema: z.object({
              results: z.array(searchResultSchema),
            }),
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'searchAndEvaluate_searchWeb',
              metadata: { query },
            },
          });

          pendingSearchResults.push(...results);

          return results;
        },
      }),
      // LLM as a judge
      evaluate: tool({
        description: 'Evaluate the search results',
        parameters: z.object({}),
        async execute() {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const pendingResult = pendingSearchResults.pop()!;

          const { object: evaluation } = await generateObject({
            model: models.flash25,
            prompt: `Evaluate whether the search results are relevant and will help answer the following query: "${query}". If the page already exists in the existing results, mark it as irrelevant.

            <search_results>
            ${JSON.stringify(pendingResult)}
            </search_results>

            <existing_results>
            ${JSON.stringify(accumulatedSources.map((result) => result.url))}
            </existing_results>

            `,
            output: 'enum',
            enum: ['relevant', 'irrelevant'],
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'searchAndEvaluate_evaluate',
              metadata: pendingResult,
            },
          });

          if (evaluation === 'relevant') {
            finalSearchResults.push(pendingResult);
          }

          return evaluation === 'irrelevant'
            ? 'Search results are irrelevant. Please search again with a more specific query.'
            : 'Search results are relevant. End research for this query.';
        },
      }),
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'searchAndEvaluate',
      metadata: crush({ query, accumulatedSources }) as Record<
        string,
        AttributeValue
      >,
    },
  });

  return finalSearchResults;
}

async function generateSearchQueries(query: string, depth = 1) {
  const { object } = await generateObject({
    model: models.flash25,
    // search query should not be too long/detailed to avoid not being able to find results
    prompt: `Generate ${depth} relevant search queries for the following query: ${query}`,
    schema: z.object({
      queries: z.array(z.string()).min(depth).max(5),
    }),
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateSearchQueries',
      metadata: { query, depth },
    },
  });

  return object.queries;
}

export const agentDeepResearchApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

agentDeepResearchApp.post(
  '/',
  describeRoute({
    description: 'Generate search queries for a given query',
    responses: {
      200: {
        description: 'The generated search queries',
        content: {
          'application/json': {
            schema: z.object({
              research: z.object({
                query: z.string(),
                queries: z.array(z.string()),
                searchResults: z.array(searchResultSchema),
                learnings: z.array(learningSchema),
                completedQueries: z.array(z.string()),
              }),
            }),
          },
        },
      },
    },
  }),
  validator(
    'json',
    z.object({
      query: z
        .string()
        .describe('The query to generate search queries for')
        .openapi({
          example: 'What do you need to be a D1 shotput athlete?',
        }),
      depth: z.number().describe('The depth of the search queries').openapi({
        example: 1,
      }),
      breadth: z
        .number()
        .describe('The breadth of the search queries')
        .openapi({
          example: 2,
        }),
    })
  ),
  async (c) => {
    const { query, depth = 1, breadth = 2 } = c.req.valid('json');
    return await recordSpan({
      tracer,
      name: 'deepResearchEndpoint',
      attributes: { query, depth, breadth },
      fn: async (span) => {
        const research = await deepResearch(query, depth, breadth);
        const report = await generateReport(research);
        const response = { research, report };

        span.setAttributes(crush(response) as Record<string, AttributeValue>);
        return c.json(response);
      },
    });
  }
);
