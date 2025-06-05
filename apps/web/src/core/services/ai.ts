import type {
  Annotation,
  Research,
  SearchResult,
  SpreadsheetAnnotation,
} from '@/core/schemas/ai';
import { searchResultSchema } from '@/core/schemas/ai';
import { type GoogleGenerativeAIProviderOptions, google } from '@ai-sdk/google';
import { logger } from '@workspace/core/utils/logger';
import {
  type DataStreamWriter,
  type Message,
  type ToolExecutionOptions,
  type ToolSet,
  convertToCoreMessages,
  formatDataStreamPart,
  generateObject,
  generateText,
  tool,
} from 'ai';
import { z } from 'zod';

const flash20 = google('gemini-2.0-flash-001');
/**
 * only one that supports generating images
 */
const flash20exp = google('gemini-2.0-flash-exp');
const flash20search = google('gemini-2.0-flash-001', {
  // don't use dynamic retrieval, it's only for 1.5 models and old-fashioned
  useSearchGrounding: true,
});
const flash25 = google('gemini-2.5-flash-preview-05-20'); // previously 04-17
const flash25search = google('gemini-2.5-flash-preview-05-20', {
  useSearchGrounding: true,
});
/**
 * pro-exp is no longer free as of 3 June 2025
 */
// const pro25 = google('gemini-2.5-pro-exp-05-06');
const embedding004 = google.textEmbeddingModel('text-embedding-004');
/**
 * Input token limit: 8,192
 * Output dimension size: Elastic, supports: 3072, 1536, or 768
 */
const geminiEmbedding = google.textEmbeddingModel('gemini-embedding-exp-03-07');

export const models = {
  flash20,
  flash20exp,
  flash20search,
  flash25,
  // flash25safety, // not supported as of 5 June 2025
  flash25search,
  // pro25,
  embedding004,
  geminiEmbedding,
};

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
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

export const SHEET_PROMPT = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

async function searchWeb(query: string) {
  logger.info({ query }, '[searchWeb]: start');
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
  const response = results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedDate: r.publishedDate,
  })) as SearchResult[];

  logger.info({ response }, '[searchWeb]: end');
  return response;
}

async function generateSearchQueries(
  query: string,
  breadth: number,
  learnings?: string[]
) {
  logger.info({ query, breadth, learnings }, '[generateSearchQueries]: start');
  const {
    object: { queries },
  } = await generateObject({
    system: DEEP_RESEARCH_SYSTEM_PROMPT,
    model: models.flash25,
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
        .min(1)
        .max(breadth)
        .describe(`List of SERP queries, max of ${breadth}`),
    }),
  });

  logger.info({ queries }, '[generateSearchQueries]: end');
  return queries;
}

async function generateLearnings(
  query: string,
  results: SearchResult[],
  numberOfLearnings: number,
  numberOfFollowUpQuestions: number
) {
  logger.info(
    { query, results, numberOfLearnings, numberOfFollowUpQuestions },
    '[generateLearnings]: start'
  );
  const {
    object: { followUpQuestions, learnings },
  } = await generateObject({
    model: models.flash25,
    system: DEEP_RESEARCH_SYSTEM_PROMPT,
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

  logger.info({ learnings, followUpQuestions }, '[generateLearnings]: end');
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
    type: 'deep-research',
    data: { status: `Generating search queries for "${prompt}"` },
  } satisfies Annotation);
  const searchQueries = await generateSearchQueries(
    prompt,
    breadth,
    accumulatedResearch.learnings
  );

  // Process each query and merge the results rather than overwrite
  const subResults = await Promise.all(
    searchQueries.map(async ({ query, researchGoal }) => {
      dataStream.writeMessageAnnotation({
        type: 'deep-research',
        data: { status: `Searching the web for "${query}"` },
      } satisfies Annotation);
      const results = await searchWeb(query);

      for (const source of results) {
        dataStream.writeMessageAnnotation({
          type: 'deep-research',
          data: {
            source: {
              title: source.title,
              url: source.url,
            },
          },
        } satisfies Annotation);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      dataStream.writeMessageAnnotation({
        type: 'deep-research',
        data: { status: `Analyzing search results for "${query}"` },
      } satisfies Annotation);
      const { learnings, followUpQuestions } = await generateLearnings(
        query,
        results,
        3,
        breadth
      );

      // Make the recursive call
      const nextQuery = `Previous research goal: ${researchGoal}${` Follow-up directions: ${followUpQuestions.map((q) => `\n${q}`).join('')}`.trim()}`;
      dataStream.writeMessageAnnotation({
        type: 'deep-research',
        data: {
          status: `Diving deeper to understand "${followUpQuestions.slice(0, 3).join(', ')}"`,
        },
      } satisfies Annotation);
      const subResearch = await deepResearch(
        dataStream,
        nextQuery,
        depth - 1,
        Math.ceil(breadth / 2),
        undefined
      );

      for (const source of subResearch.sources) {
        dataStream.writeMessageAnnotation({
          type: 'deep-research',
          data: { source: { title: source.title, url: source.url } },
        } satisfies Annotation);
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
  logger.info({ prompt, research }, '[generateReport]: start');
  const { learnings, sources, questionsExplored, searchQueries } = research;
  const { text: content } = await generateText({
    model: models.flash25,
    system: `${DEEP_RESEARCH_SYSTEM_PROMPT}\n- Write in markdown sytax.`,
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
    model: models.flash25,
    prompt: `Generate a punchy title (5 words) for the following report:\n\n${content}`,
    schema: z.object({
      title: z.string().describe('The impactful title of the report'),
    }),
  });
  const response = { content, title: object.title };

  logger.info(response, '[generateReport]: end');
  return response;
}

export const tools = {
  webSearchNative: (dataStream: DataStreamWriter) => {
    return tool({
      description: 'Use this tool to search the web for information.',
      parameters: z.object({
        query: z.string().min(1).max(200).describe('The search query'),
      }),
      execute: async ({ query }) => {
        logger.info({ query }, '[webSearchNative]: start');
        const { sources, text } = await generateText({
          model: models.flash25search,
          prompt: query,
        });

        for (const source of sources) {
          dataStream.writeMessageAnnotation({
            type: 'web-search',
            data: { source },
          } satisfies Annotation);
        }

        logger.info({ sources, text }, '[webSearchNative]: end');
        return {
          sources,
          text,
        };
      },
    });
  },
  /**
   * This tool returns specific result schema using generateObject.
   */
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
        .default(3)
        .describe('The number of web search results to return'),
    }),
    execute: async ({ query, limit = 3 }) => {
      logger.info({ query, limit }, '[webSearch]: start');
      const {
        // sources,
        // experimental_output: { results },
        object: { results },
      } = await generateObject({
        model: models.flash25search,
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
      const response = results.map((result) => ({
        title: result.title,
        url: result.url, // hallucination
        snippet: result.content, // Limit snippet length
        domain: new URL(result.url).hostname, // Extract domain for source context
        date: result.publishedDate || 'Date not available', // Include publish date when available
      }));

      logger.info(response, '[webSearch]: end');
      return response;
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
        logger.info({ prompt, depth, breadth }, '[deepResearch]: start');
        dataStream.writeMessageAnnotation({
          type: 'deep-research',
          data: { status: 'Beginning deep research' },
        } satisfies Annotation);

        const research = await deepResearch(
          dataStream,
          prompt,
          depth,
          breadth,
          undefined
        );
        dataStream.writeMessageAnnotation({
          type: 'deep-research',
          data: { status: 'Generating report...' },
        } satisfies Annotation);

        const report = await generateReport(prompt, research);
        dataStream.writeMessageAnnotation({
          type: 'deep-research',
          data: { status: 'Successfully generated report' },
        } satisfies Annotation);

        const sources = Array.from(
          new Map(
            research.sources.map((s) => [
              s.url,
              { ...s, content: `${s.content.slice(0, 50)}...` },
            ])
          ).values()
        );
        const response = {
          report,
          research: {
            ...research,
            sources,
          },
        };

        logger.info(response, '[deepResearch]: end');
        return response;
      },
    });
  },
  generateImage: tool({
    description: 'Generate an image based on input prompt',
    parameters: z.object({
      prompt: z
        .string()
        .describe(
          'The prompt to generate the image from, should be a short description of the image you want to see'
        ),
      style: z
        .string()
        .describe(
          'The style of the image to generate, e.g. "anime", "realistic", "cartoon", "sketch", "vector", "3D", "abstract", "minimalist", "neon", "cyberpunk", "retro", "vintage"'
        )
        .default('anime')
        .optional(),
    }),
    execute: async ({ prompt, style = 'anime' }) => {
      logger.info({ prompt, style }, '[generateImage]: start');
      const result = await generateText({
        model: models.flash20exp,
        prompt: `${prompt} in ${style} style`,
        providerOptions: {
          google: {
            responseModalities: ['TEXT', 'IMAGE'],
          } satisfies GoogleGenerativeAIProviderOptions,
        },
      });

      /**
       * we can then use the base64 in client side to display the image
       */
      const files = result.files.map((file) => ({
        // remove the uint8Array
        base64: file.base64,
        mimeType: file.mimeType,
      }));

      logger.info(`${files.length} image`, '[generateImage]: end');
      // in production, save this image to blob storage and return a URL instead
      return { files, prompt };
    },
  }),
  getWeatherInformation: tool({
    description: 'show the weather in a given city to the user',
    parameters: z.object({
      city: z.string().describe('the city to get the weather for'),
    }),
    // execute function removed to stop automatic execution (human in the loop)
  }),
  /**
   * not used
   */
  askQuestion: tool({
    description:
      'Ask a clarifying question with multiple options when more information is needed',
    parameters: z.object({
      question: z.string().describe('The main question to ask the user'),
      options: z
        .array(
          z.object({
            value: z.string().describe('Option identifier (always in English)'),
            label: z.string().describe('Display text for the option'),
          })
        )
        .describe('List of predefined options'),
      allowsInput: z
        .boolean()
        .describe('Whether to allow free-form text input'),
      inputLabel: z
        .string()
        .optional()
        .describe('Label for free-form input field'),
      inputPlaceholder: z
        .string()
        .optional()
        .describe('Placeholder text for input field'),
    }),
    // execute function removed to enable frontend confirmation
  }),
  createSpreadsheet: (dataStream: DataStreamWriter) =>
    tool({
      description:
        'Create a spreadsheet or excel for a writing or content creation activities in CSV format. This tool will generate the title and the content of the spreadsheet based on the input query.',
      parameters: z.object({
        query: z
          .string()
          .describe(
            'The query what the user wants to generate the spreadsheet from'
          ),
      }),
      execute: async ({ query }) => {
        logger.info({ query }, '[createSpreadsheet]: start');
        dataStream.writeMessageAnnotation({
          type: 'spreadsheet',
          data: {
            status: 'Generating spreadsheet...',
          },
        } satisfies SpreadsheetAnnotation);

        const { object } = await generateObject({
          model: models.flash25,
          system: SHEET_PROMPT,
          prompt: query,
          schema: z.object({
            title: z.string().describe('The title of the spreadsheet'),
            csv: z.string().describe('CSV data'),
          }),
        });

        logger.info(object, '[createSpreadsheet]: end');
        return object;
      },
    }),
};

// biome-ignore lint/correctness/noEmptyPattern: <explanation>
export function executeGetWeatherInformationTool({}: { city: string }) {
  const weatherOptions = [
    'sunny',
    'cloudy',
    'rainy',
    'snowy',
    'stormy',
    'foggy',
  ];
  return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
}

// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: 'Yes, confirmed.',
  NO: 'No, denied.',
} as const;

/**
 * Check if a tool name is valid
 * @param key - The key to check
 * @param obj - The object to check
 * @returns True if the key is valid, false otherwise
 */
function isValidToolName<K extends PropertyKey, T extends object>(
  key: K,
  obj: T
): key is K & keyof T {
  return key in obj;
}

/**
 * Processes tool invocations where human input is required, executing tools when authorized.
 *
 * @param options - The function options
 * @param options.tools - Map of tool names to Tool instances that may expose execute functions
 * @param options.dataStream - Data stream for sending results back to the client
 * @param options.messages - Array of messages to process
 * @param executionFunctions - Map of tool names to execute functions
 * @returns Promise resolving to the processed messages
 */
export async function processToolCalls<
  Tools extends ToolSet,
  ExecutableTools extends {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    [Tool in keyof Tools as Tools[Tool] extends { execute: Function }
      ? never
      : Tool]: Tools[Tool];
  },
>(
  {
    dataStream,
    messages,
  }: {
    tools: Tools; // used for type inference
    dataStream: DataStreamWriter;
    messages: Message[];
  },
  executeFunctions: {
    [K in keyof Tools & keyof ExecutableTools]?: (
      args: z.infer<ExecutableTools[K]['parameters']>,
      context: ToolExecutionOptions
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ) => Promise<any>;
  }
): Promise<Message[]> {
  /**
   * Before sending the new messages to the language model,
   * we pull out the last message and map through the message parts to see if the tool requiring confirmation was called
   * and whether it's in a "result" state
   */
  // biome-ignore lint/nursery/useAtIndex: <explanation>
  const lastMessage = messages[messages.length - 1];

  const parts = lastMessage?.parts;
  if (!parts) {
    return messages;
  }

  const processedParts = await Promise.all(
    parts.map(async (part) => {
      // Only process tool invocations parts
      if (part.type !== 'tool-invocation') {
        return part;
      }

      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName;

      // Only continue if we have an execute function for the tool (meaning it requires confirmation) and it's in a 'result' state
      if (
        !(toolName in executeFunctions) ||
        toolInvocation.state !== 'result'
      ) {
        return part;
      }

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      let result: any;

      if (toolInvocation.result === APPROVAL.YES) {
        // Get the tool and check if the tool has an execute function.
        if (
          !isValidToolName(toolName, executeFunctions) ||
          toolInvocation.state !== 'result'
        ) {
          return part;
        }

        const toolInstance = executeFunctions[toolName];
        if (toolInstance) {
          result = await toolInstance(toolInvocation.args, {
            messages: convertToCoreMessages(messages),
            toolCallId: toolInvocation.toolCallId,
          });
        } else {
          result = 'Error: No execute function found on tool';
        }
      } else if (toolInvocation.result === APPROVAL.NO) {
        result = 'Error: User denied access to tool execution';
      } else {
        // For any unhandled responses, return the original part.
        return part;
      }

      // Forward updated tool result to the client.
      dataStream.write(
        formatDataStreamPart('tool_result', {
          toolCallId: toolInvocation.toolCallId,
          result,
        })
      );

      // Return updated toolInvocation with the actual result.
      return {
        ...part,
        toolInvocation: {
          ...toolInvocation,
          result,
        },
      };
    })
  );
  const newMessages = [
    ...messages.slice(0, -1),
    { ...lastMessage, parts: processedParts },
  ];

  // Finally return the processed messages with updated last message
  return newMessages;
}

export const toolsWithConfirmation = {
  getWeatherInformation: tools.getWeatherInformation,
};

/**
 * Get the tools that require confirmation from the user
 * @param tools - The tools to check
 * @returns The tools that require confirmation
 */
export function getToolsRequiringConfirmation<T extends ToolSet>(
  tools: T
): string[] {
  return (Object.keys(tools) as (keyof T)[]).filter((key) => {
    const maybeTool = tools[key];
    return typeof maybeTool?.execute !== 'function';
  }) as string[];
}
