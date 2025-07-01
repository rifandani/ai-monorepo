import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { type AttributeValue, metrics, trace } from '@opentelemetry/api';
import { generateObject, generateText, tool } from 'ai';
import { crush } from 'radashi';
import { z as z3 } from 'zod/v3';
import { models } from '@/core/api/ai';
import type { Variables } from '@/core/types/hono';
import { recordSpan } from '@/core/utils/telemetry';

const tracer = trace.getTracer('deepResearchEndpoint', '1.0.0');
const meter = metrics.getMeter('deepResearchEndpoint', '1.0.0');
const queriesCounter = meter.createCounter('deepResearch.queries');
const searchResultsCounter = meter.createCounter('deepResearch.searchResults');

const searchResultSchema = z3.object({
  title: z3.string().describe('The title of the search result'),
  content: z3.string().describe('The content of the search result'),
  url: z3.string().describe('The url of the search result source'),
});
export type SearchResult = z3.infer<typeof searchResultSchema>;

const learningSchema = z3.object({
  learning: z3.string().describe('The learning from the search result'),
  followUpQuestions: z3
    .array(z3.string())
    .describe('The follow-up questions from the search result'),
});

const researchSchema = z3.object({
  query: z3.string().optional().describe('The current query to research'),
  queries: z3
    .array(z3.string())
    .describe('The current relevant search queries based on query'),
  searchResults: z3
    .array(searchResultSchema)
    .describe('The accumulated search results'),
  learnings: z3.array(learningSchema).describe('The accumulated learnings'),
  completedQueries: z3
    .array(z3.string())
    .describe('The accumulated completed queries'),
});
type Research = z3.infer<typeof researchSchema>;

const searchWebParamsSchema = z3.object({
  query: z3.string().min(1).describe('The query to search the web for'),
});
const searchWebSchema = z3.object({
  results: z3.array(searchResultSchema).describe('The search results'),
});

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
      for (const _query of queries) {
        queriesCounter.add(1);
        const searchResults = await searchAndEvaluate(
          _query,
          accumulatedResearch.searchResults
        );
        accumulatedResearch.searchResults.push(...searchResults);

        for (const searchResult of searchResults) {
          searchResultsCounter.add(1);
          const learnings = await generateLearningAndFollowUpQuestions(
            _query,
            searchResult
          );
          accumulatedResearch.learnings.push(learnings);
          accumulatedResearch.completedQueries.push(_query);

          // call deepResearch recursively with decrementing depth and breadth
          await deepResearch(
            `Overall research goal: ${_query}
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

/**
 * Search the web for information about a given query, and evaluate if the results are relevant and will help answer the following query
 *
 * @param query - The query to search for
 * @param accumulatedSources - The accumulated search results
 * @returns The final search results
 */
export async function searchAndEvaluate(
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
        parameters: searchWebParamsSchema,
        async execute({ query: _query }) {
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
            prompt: _query,
            // experimental_output: Output.object({
            //   schema: z.object({
            //     results: z.array(searchResultSchema),
            //   }),
            // }),
            schema: searchWebSchema,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'searchAndEvaluate_searchWeb',
              metadata: { query: _query },
            },
          });

          pendingSearchResults.push(...results);

          return results;
        },
      }),
      // LLM as a judge
      evaluate: tool({
        description: 'Evaluate the search results',
        parameters: z3.object({}),
        async execute() {
          // biome-ignore lint/style/noNonNullAssertion: xxx
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

/**
 * Generate search queries for a given query and depth
 *
 * @param query - The query to generate search queries for
 * @param depth - The number of levels of search queries to generate. Default is 1.
 * @returns The generated search queries
 */
export async function generateSearchQueries(query: string, depth = 1) {
  const { object } = await generateObject({
    model: models.flash25,
    // search query should not be too long/detailed to avoid not being able to find results
    prompt: `Generate ${depth} relevant search queries for the following query: ${query}`,
    schema: z3.object({
      queries: z3.array(z3.string()).min(depth).max(5),
    }),
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateSearchQueries',
      metadata: { query, depth },
    },
  });

  return object.queries;
}

export function deepResearchRoutes(
  app: OpenAPIHono<{
    Variables: Variables;
  }>
) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/deep-research',
      summary: 'Agent: Deep Research',
      description:
        'An agent that specialized in generating deep research report',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                query: z
                  .string()
                  .describe('The query to generate search queries for')
                  .openapi({
                    example: 'What do you need to be a D1 shotput athlete?',
                  }),
                depth: z
                  .number()
                  .describe('The depth of the search queries')
                  .openapi({
                    example: 1,
                  }),
                breadth: z
                  .number()
                  .describe('The breadth of the search queries')
                  .openapi({
                    example: 2,
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Deep research report',
          content: {
            'application/json': {
              schema: z.object({
                research: z.object({
                  query: z
                    .string()
                    .optional()
                    .describe('The current query to research'),
                  queries: z
                    .array(z.string())
                    .describe(
                      'The current relevant search queries based on query'
                    ),
                  searchResults: z
                    .array(
                      z.object({
                        title: z
                          .string()
                          .describe('The title of the search result'),
                        content: z
                          .string()
                          .describe('The content of the search result'),
                        url: z
                          .string()
                          .describe('The url of the search result source'),
                      })
                    )
                    .describe('The accumulated search results'),
                  learnings: z
                    .array(
                      z.object({
                        learning: z
                          .string()
                          .describe('The learning from the search result'),
                        followUpQuestions: z
                          .array(z.string())
                          .describe(
                            'The follow-up questions from the search result'
                          ),
                      })
                    )
                    .describe('The accumulated learnings'),
                  completedQueries: z
                    .array(z.string())
                    .describe('The accumulated completed queries'),
                }),
                report: z.string().describe('The deep research report'),
              }),
            },
          },
        },
      },
    }),
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
}
