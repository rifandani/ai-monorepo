import { google } from '@ai-sdk/google';
import { type DataStreamWriter, generateObject, generateText, tool } from 'ai';
import { z } from 'zod';

export type Research = {
  learnings: string[];
  sources: SearchResult[];
  questionsExplored: string[];
  searchQueries: string[];
};

const flash20 = google('gemini-2.0-flash-001');
const flash20search = google('gemini-2.0-flash-001', {
  // don't use dynamic retrieval, it's only for 1.5 models and old-fashioned
  useSearchGrounding: true,
});
const pro25 = google('gemini-2.5-pro-exp-03-25');

export const models = {
  flash20,
  flash20search,
  pro25,
};

const searchResultSchema = z.object({
  title: z.string().describe('The title of the search result'),
  content: z.string().describe('The content of the search result'),
  url: z.string().describe('The url of the search result source'),
  publishedDate: z
    .string()
    .datetime()
    .describe('The date the search result was published'),
});
type SearchResult = z.infer<typeof searchResultSchema>;

const SYSTEM_PROMPT = `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
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
  - You must provide links to sources used. Ideally these are inline e.g. [this documentation](https://documentation.com/this)
  `;

async function searchWeb(query: string) {
  const {
    // sources,
    // experimental_output: { results },
    object: { results },
  } = await generateObject({
    model: flash20search,
    prompt: query,
    // experimental_output: Output.object({
    //   schema: z.object({
    //     results: z.array(searchResultSchema),
    //   }),
    // }),
    schema: z.object({
      results: z
        .array(searchResultSchema)
        .max(3)
        .describe('The web search results'),
    }),
  });

  return results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedDate: r.publishedDate,
  })) as SearchResult[];
}

async function generateSearchQueries(
  query: string,
  breadth: number,
  learnings?: string[]
) {
  const {
    object: { queries },
  } = await generateObject({
    system: SYSTEM_PROMPT,
    model: flash20,
    prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Ensure at least one is almost identical to the initial prompt. Return a maximum of ${breadth} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
      learnings
        ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
            '\n'
          )}`
        : ''
    }`,
    schema: z.object({
      queries: z
        .array(
          z.object({
            query: z.string().describe('The SERP query'),
            researchGoal: z
              .string()
              .describe(
                'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.'
              ),
          })
        )
        .describe(`List of SERP queries, max of ${breadth}`),
    }),
  });

  return queries;
}

async function generateLearnings(
  query: string,
  results: SearchResult[],
  numberOfLearnings: number,
  numberOfFollowUpQuestions: number
) {
  const {
    object: { followUpQuestions, learnings },
  } = await generateObject({
    model: flash20,
    system: SYSTEM_PROMPT,
    prompt: `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numberOfLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${results
      .map((content) => `<content>\n${content.content}\n</content>`)
      .join('\n')}</contents>`,
    schema: z.object({
      learnings: z
        .array(z.string())
        .max(numberOfLearnings)
        .describe(`List of learnings, max of ${numberOfLearnings}`),
      followUpQuestions: z
        .array(z.string())
        .max(numberOfFollowUpQuestions)
        .describe(
          `List of follow-up questions to research the topic further, max of ${numberOfFollowUpQuestions}`
        ),
    }),
  });

  return {
    learnings,
    followUpQuestions,
  };
}

async function deepResearch(
  dataStream: DataStreamWriter,
  prompt: string,
  depth = 1,
  breadth = 3,
  accumulatedResearch: Research = {
    learnings: [],
    sources: [],
    questionsExplored: [],
    searchQueries: [],
  }
): Promise<Research> {
  // Base case: regardless whether accumulatedResearch is present or empty, if depth is 0 we stop.
  if (depth === 0) {
    return accumulatedResearch;
  }

  dataStream.writeMessageAnnotation({
    status: { title: `Generating search queries for "${prompt}"` },
  });
  const searchQueries = await generateSearchQueries(
    prompt,
    breadth,
    accumulatedResearch.learnings
  );
  dataStream.writeMessageAnnotation({
    status: { title: `Generated search queries for "${prompt}"` },
  });

  // Process each query and merge the results rather than overwrite
  const subResults = await Promise.all(
    searchQueries.map(async ({ query, researchGoal }) => {
      dataStream.writeMessageAnnotation({
        status: { title: `Searching the web for "${query}"` },
      });
      const results = await searchWeb(query);
      for (const source of results) {
        dataStream.writeMessageAnnotation({
          source: { title: source.title, url: source.url },
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      dataStream.writeMessageAnnotation({
        status: { title: `Analyzing search results for "${query}"` },
      });

      const { learnings, followUpQuestions } = await generateLearnings(
        query,
        results,
        3,
        breadth
      );
      const nextQuery = `Previous research goal: ${researchGoal}${` Follow-up directions: ${followUpQuestions.map((q) => `\n${q}`).join('')}`.trim()}`;

      // Make the recursive call
      dataStream.writeMessageAnnotation({
        status: {
          title: `Diving deeper to understand "${followUpQuestions.slice(0, 3).join(', ')}"`,
        },
      });
      const subResearch = await deepResearch(
        dataStream,
        nextQuery,
        depth - 1,
        Math.ceil(breadth / 2),
        undefined
      );

      for (const source of subResearch.sources) {
        dataStream.writeMessageAnnotation({
          source: { title: source.title, url: source.url },
        });
      }

      // Merge the research found at this level with the research in the child call.
      return {
        learnings,
        sources: results,
        questionsExplored: followUpQuestions,
        searchQueries: [query, ...subResearch.searchQueries],
        // Also merge in subResearch learnings, sources, and questions.
        subLearnings: subResearch.learnings,
        subSources: subResearch.sources,
        subQuestionsExplored: subResearch.questionsExplored,
      };
    })
  );
  for (const res of subResults) {
    accumulatedResearch.learnings.push(...res.learnings, ...res.subLearnings);
    accumulatedResearch.sources.push(...res.sources, ...res.subSources);
    accumulatedResearch.questionsExplored.push(
      ...res.questionsExplored,
      ...res.subQuestionsExplored
    );
    accumulatedResearch.searchQueries.push(...res.searchQueries);
  }

  return accumulatedResearch;
}

async function generateReport(prompt: string, research: Research) {
  const { learnings, sources, questionsExplored, searchQueries } = research;
  const { text: content } = await generateText({
    model: pro25,
    system: `${SYSTEM_PROMPT}\n- Write in markdown sytax.`,
    prompt: `Generate a comprehensive report focused on "${prompt}". The main research findings should be drawn from the learnings below, with the search queries and related questions explored serving as supplementary context. Focus on synthesizing the key insights into a coherent narrative around the main topic.

    <learnings>
    ${learnings.map((l) => `\n<learning>${l}</learning>`).join('')}
    </learnings>

    <searchQueries>
    ${searchQueries.map((q) => `\n<query>${q}</query>`).join('')}
    </searchQueries>

    <relatedQuestions>
    ${questionsExplored.map((q) => `\n<question>${q}</question>`).join('')}
    </relatedQuestions>

    <sources>
    ${sources.map((s) => `\n<source>${JSON.stringify({ ...s, content: s.content.slice(0, 350) })}</source>`).join('')}
    </sources>
    `,
  });

  const { object } = await generateObject({
    model: flash20,
    prompt: `Generate a punchy title (5 words) for the following report:\n\n${content}`,
    schema: z.object({
      title: z.string(),
    }),
  });

  return { content, title: object.title };
}

export const tools = {
  webSearch: tool({
    description: 'Use this tool to search the web for information.',
    parameters: z.object({
      query: z
        .string()
        .min(1)
        .max(200)
        .describe(
          "The search query - be specific and include terms like 'vs', 'features', 'comparison' for better results"
        ),
      limit: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe('The number of web search results to return'),
    }),
    execute: async ({ query, limit }) => {
      const {
        // sources,
        // experimental_output: { results },
        object: { results },
      } = await generateObject({
        model: flash20search,
        prompt: query,
        // experimental_output: Output.object({
        //   schema: z.object({
        //     results: z.array(searchResultSchema),
        //   }),
        // }),
        schema: z.object({
          results: z
            .array(searchResultSchema)
            .min(limit)
            .describe('The web search results'),
        }),
      });

      // Process and clean the results
      return results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content, // Limit snippet length
        domain: new URL(result.url).hostname, // Extract domain for source context
        date: result.publishedDate || 'Date not available', // Include publish date when available
      }));
    },
  }),
  deepResearch: (dataStream: DataStreamWriter) => {
    return tool({
      description: 'Use this tool to conduct a deep research on a given topic.',
      parameters: z.object({
        prompt: z
          .string()
          .min(1)
          .max(1000)
          .describe(
            "This should take the user's exact prompt. Extract from the context but do not infer or change in any way."
          ),
        depth: z
          .number()
          .min(1)
          .max(3)
          .default(1)
          .describe(
            'Default to 1 unless the user specifically references otherwise'
          ),
        breadth: z
          .number()
          .min(1)
          .max(5)
          .default(3)
          .describe(
            'Default to 3 unless the user specifically references otherwise'
          ),
      }),
      execute: async ({ prompt, depth, breadth }) => {
        dataStream.writeMessageAnnotation({
          status: { title: 'Beginning deep research' },
        });

        const research = await deepResearch(
          dataStream,
          prompt,
          depth,
          breadth,
          undefined
        );
        dataStream.writeMessageAnnotation({
          status: { title: 'Generating report...' },
        });

        const report = await generateReport(prompt, research);
        dataStream.writeMessageAnnotation({
          status: { title: 'Successfully generated report' },
        });

        return {
          report,
          research: {
            ...research,
            sources: Array.from(
              new Map(
                research.sources.map((s) => [
                  s.url,
                  { ...s, content: `${s.content.slice(0, 50)}...` },
                ])
              ).values()
            ),
          },
        };
      },
    });
  },
};
