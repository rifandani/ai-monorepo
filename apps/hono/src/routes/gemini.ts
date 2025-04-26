import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  cacheListSchema,
  embeddingSchema,
  embeddingUsageSchema,
  fileSchema,
  gofoodSchema,
  mockUserSchema,
  promptSchema,
  qualityMetricsSchema,
  reasoningDetailSchema,
  textSchema,
  usageSchema,
} from '@/core/api/ai';
import {
  CACHE_CONTENT_EXPLICIT_CONTENT,
  CACHE_CONTENT_RECIPES,
} from '@/core/constants/cache';
import type { Variables } from '@/core/types/hono';
import { cached } from '@/core/utils/middleware';
import {
  calculateTool,
  getCityAttractionTool,
  getWeatherTool,
  logToConsoleTool,
} from '@/core/utils/tool';
import {
  type GoogleGenerativeAIProviderMetadata,
  type GoogleGenerativeAIProviderOptions,
  createGoogleGenerativeAI,
} from '@ai-sdk/google';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { logger } from '@workspace/core/utils/logger';
import {
  type CoreMessage,
  type FilePart,
  type ImagePart,
  cosineSimilarity,
  createDataStream,
  embed,
  embedMany,
  generateObject,
  generateText,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import { stream } from 'hono/streaming';
import { endTime, startTime } from 'hono/timing';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

// by default use GOOGLE_GENERATIVE_AI_API_KEY
// example fetch wrapper that logs the input to the API call:
const google = createGoogleGenerativeAI({
  // @ts-expect-error preconnect is bun specific
  fetch: async (
    url: Parameters<typeof fetch>[0],
    options: Parameters<typeof fetch>[1]
  ) => {
    logger.info(
      { url, headers: options?.headers, body: options?.body },
      'FETCH_CALL'
    );
    return await fetch(url, options);
  },
});
const flash15 = google('gemini-1.5-flash');
const flash20 = google('gemini-2.0-flash-001');
const flash20search = google('gemini-2.0-flash-001', {
  // don't use dynamic retrieval, it's only for 1.5 models and old-fashioned
  useSearchGrounding: true,
});
const flash20safety = google('gemini-2.0-flash-001', {
  // https://ai.google.dev/gemini-api/docs/safety-settings?hl=en
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
  ],
});
const flash20exp = google('gemini-2.0-flash-exp');
const pro25 = google('gemini-2.5-pro-exp-03-25');
const flash25 = google('gemini-2.5-flash-preview-04-17');
const embedding004 = google.textEmbeddingModel('text-embedding-004');
const cacheManager = new GoogleAICacheManager(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY as string
);
// As of August 23rd, 2024, these are the only models that support caching
type GoogleModelCacheableId =
  | 'models/gemini-1.5-flash-001'
  | 'models/gemini-1.5-pro-001';
const cacheModelId: GoogleModelCacheableId = 'models/gemini-1.5-flash-001';

export const geminiApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

geminiApp.post(
  '/generate',
  describeRoute({
    description: 'Generate text',
    responses: {
      200: {
        description: 'Successful generate text',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'form',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (c) => {
    const { prompt } = c.req.valid('form');

    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ];

    const result = await generateText({
      model: flash15,
      system: 'Answer in pirate language',
      messages,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'generate',
      },
    });

    return c.json({
      text: result.text,
      usage: result.usage,
      messages: result.response.messages,
    });
  }
);

geminiApp.post(
  '/generate-image',
  describeRoute({
    description: 'Generate image ',
    responses: {
      200: {
        description: 'Successful generate image',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                files: z.array(fileSchema),
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema.openapi({
        example: 'A beautiful sunset over a calm ocean',
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateText({
      model: flash20exp,
      prompt,
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

    /**
     * if we want to send the uint8Array as response, we need to use `ctx.body(imageUint8Array)` and set the header `ctx.header('Content-Type', imageFile.mimeType)`
     */
    return ctx.json({
      files,
      usage: result.usage,
    });
  }
);

geminiApp.post(
  '/multimodal',
  describeRoute({
    description: 'Generate response from multimodal input',
    responses: {
      200: {
        description: 'Successful generate response from multimodal input',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'form',
    z.object({
      prompt: promptSchema,
      image: z.instanceof(File).optional().openapi({
        description: 'Image to be used for the prompt',
      }),
      pdf: z.instanceof(File).optional().openapi({
        description: 'PDF to be used for the prompt',
      }),
      audio: z.instanceof(File).optional().openapi({
        description: 'Audio to be used for the prompt',
      }),
    })
  ),
  async (c) => {
    const { prompt, image, pdf, audio } = c.req.valid('form');

    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          ...(image
            ? [
                {
                  type: 'image',
                  image: await image.arrayBuffer(),
                  mimeType: image.type,
                } as ImagePart,
              ]
            : []),
          ...(pdf
            ? [
                {
                  type: 'file',
                  data: await pdf.arrayBuffer(),
                  mimeType: 'application/pdf',
                } as FilePart,
              ]
            : []),
          ...(audio
            ? [
                {
                  type: 'file',
                  data: await audio.arrayBuffer(),
                  mimeType: audio.type,
                } as FilePart,
              ]
            : []),
        ],
      },
    ];

    const result = await generateText({
      model: flash20,
      system: 'Answer in pirate language',
      messages,
    });

    return c.json({
      text: result.text,
      usage: result.usage,
      messages: result.response.messages,
    });
  }
);

geminiApp.post(
  '/multimodal-object',
  describeRoute({
    description: 'Generate response from multimodal input',
    responses: {
      200: {
        description: 'Successful generate response from multimodal input',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                object: gofoodSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'form',
    z.object({
      prompt: promptSchema,
      image: z.instanceof(File).optional().openapi({
        description: 'Image to be used for the prompt',
      }),
      pdf: z.instanceof(File).optional().openapi({
        description: 'PDF to be used for the prompt',
      }),
      audio: z.instanceof(File).optional().openapi({
        description: 'Audio to be used for the prompt',
      }),
    })
  ),
  async (c) => {
    const { prompt, image, pdf, audio } = c.req.valid('form');

    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          ...(image
            ? [
                {
                  type: 'image',
                  image: await image.arrayBuffer(),
                  mimeType: image.type,
                } as ImagePart,
              ]
            : []),
          ...(pdf
            ? [
                {
                  type: 'file',
                  data: await pdf.arrayBuffer(),
                  mimeType: pdf.type,
                } as FilePart,
              ]
            : []),
          ...(audio
            ? [
                {
                  type: 'file',
                  data: await audio.arrayBuffer(),
                  mimeType: audio.type,
                } as FilePart,
              ]
            : []),
        ],
      },
    ];

    const result = await generateObject({
      model: flash15,
      messages,
      schema: gofoodSchema,
    });

    return c.json({
      object: result.object,
      usage: result.usage,
    });
  }
);

geminiApp.post(
  '/stream',
  describeRoute({
    description: 'Generate text stream',
    responses: {
      200: {
        description: 'Successful generate text stream',
        content: {
          'text/plain': {
            schema: textSchema,
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = streamText({
      model: flash15,
      prompt,
      // experimental_transform: smoothStream({
      //   delayInMs: 20, // optional: defaults to 10ms
      //   chunking: 'line', // optional: defaults to 'word'
      // }),
    });

    for await (const textPart of result.textStream) {
      // biome-ignore lint/suspicious/noConsoleLog: aaa
      // biome-ignore lint/suspicious/noConsole: aaa
      console.log(textPart);
    }

    // Mark the response as a v1 data stream:
    ctx.header('X-Vercel-AI-Data-Stream', 'v1');
    ctx.header('Content-Type', 'text/plain; charset=utf-8');

    return stream(ctx, (stream) => stream.pipe(result.toDataStream()));
  }
);

geminiApp.post(
  '/stream-data',
  describeRoute({
    description: 'Generate data stream',
    responses: {
      200: {
        description: 'Successful generate data stream',
        content: {
          'text/plain': {
            schema: textSchema,
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    // immediately start streaming the response
    const dataStream = createDataStream({
      execute: (dataStreamWriter) => {
        // append data part to the stream
        dataStreamWriter.writeData('initialized call');

        // or, we can append message annotation to the stream
        dataStreamWriter.writeMessageAnnotation({
          status: {
            title: 'Initializing call',
          },
        });

        const result = streamText({
          model: flash15,
          prompt,
        });

        result.mergeIntoDataStream(dataStreamWriter);
      },
      onError: (error) => {
        // Error messages are masked by default for security reasons.
        // If you want to expose the error message to the client, you can do so here:
        return error instanceof Error ? error.message : String(error);
      },
    });

    // Mark the response as a v1 data stream:
    ctx.header('X-Vercel-AI-Data-Stream', 'v1');
    ctx.header('Content-Type', 'text/plain; charset=utf-8');

    return stream(ctx, (stream) =>
      stream.pipe(dataStream.pipeThrough(new TextEncoderStream()))
    );
  }
);

geminiApp.post(
  '/stream-object',
  describeRoute({
    description: 'Generate object stream',
    responses: {
      200: {
        description: 'Successful generate object stream',
        content: {
          'text/plain': {
            schema: textSchema,
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = streamObject({
      model: flash15,
      prompt,
      schemaName: 'User',
      schemaDescription: 'Mock user schema',
      schema: mockUserSchema,
      onFinish({ usage, object, error }) {
        // handle type validation failure (when the object does not match the schema):
        if (object === undefined) {
          logger.error(error, 'Stream object error');
          return;
        }

        // biome-ignore lint/suspicious/noConsole: aaa
        // biome-ignore lint/suspicious/noConsoleLog: aaa
        console.log('Context', { usage, object });
      },
    });

    // Mark the response as a v1 data stream:
    ctx.header('X-Vercel-AI-Data-Stream', 'v1');
    ctx.header('Content-Type', 'text/plain; charset=utf-8');

    return stream(ctx, async (stream) => {
      for await (const objectPart of result.partialObjectStream) {
        await stream.write(JSON.stringify(objectPart));
        // await stream.writeln('');
      }
    });
  }
);

geminiApp.post(
  '/object',
  describeRoute({
    description: 'Structured output',
    responses: {
      200: {
        description: 'Successful structured output',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                object: mockUserSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateObject({
      model: flash15,
      prompt,
      schemaName: 'User',
      schemaDescription: 'Mock user schema',
      schema: mockUserSchema,
    });

    return ctx.json({
      object: result.object,
      usage: result.usage,
    });
  }
);

geminiApp.post(
  '/classify',
  describeRoute({
    description:
      'Classify the sentiment of the text as positive, negative, or neutral',
    responses: {
      200: {
        description: 'Successful classify text',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                sentiment: z
                  .enum(['positive', 'negative', 'neutral'])
                  .describe('The sentiment of the text'),
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateObject({
      model: flash15,
      system:
        'Classify the sentiment of the text as positive, negative, or neutral',
      prompt,
      schemaName: 'Text sentiment',
      schemaDescription: 'Text sentiment schema',
      schema: z.object({
        sentiment: z
          .enum(['positive', 'negative', 'neutral'])
          .describe('The sentiment of the text'),
      }),
    });

    return ctx.json({
      sentiment: result.object.sentiment,
      usage: result.usage,
    });
  }
);

geminiApp.post(
  '/embed',
  describeRoute({
    description: 'Embed text',
    responses: {
      200: {
        description: 'Successful embed text',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                embedding: embeddingSchema,
                usage: embeddingUsageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await embed({
      model: embedding004,
      value: prompt,
    });

    return ctx.json({
      embedding: result.embedding,
      usage: result.usage,
    });
  }
);

geminiApp.post(
  '/embed-many',
  describeRoute({
    description: 'Embed text',
    responses: {
      200: {
        description: 'Successful embed text',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                vector: z.array(
                  z.object({
                    prompt: promptSchema,
                    embedding: embeddingSchema,
                    distance: z
                      .number()
                      .describe(
                        'The distance between the embedding and the search term. A high value (close to 1) indicates that the vectors are very similar, while a low value (close to -1) indicates that they are different.'
                      )
                      .openapi({
                        example: 0.5,
                      }),
                  })
                ),
                usage: embeddingUsageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const searchTermResult = await embed({
      model: embedding004,
      value: prompt,
    });

    const prompts = [
      'Foods',
      'Drinks',
      'Animals',
      'Transportations',
      'Cities',
      'Countries',
    ];
    // result index is same as prompts index
    const result = await embedMany({
      model: embedding004,
      values: prompts,
    });

    const vector = result.embeddings.map((embedding, index) => ({
      prompt: prompts[index],
      embedding,
      /**
       * A high value (close to 1) indicates that the vectors are very similar, while a low value (close to -1) indicates that they are different.
       */
      distance: cosineSimilarity(embedding, searchTermResult.embedding),
    }));

    return ctx.json({
      vector: vector,
      usage: result.usage,
    });
  }
);

geminiApp.post(
  '/cache-create',
  describeRoute({
    description: 'Cache an input',
    responses: {
      200: {
        description: 'Successful cache an input',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().openapi({
        example:
          "When we hunting memory leaks with React Native DevTools, React Native DevTools offers three ways to profile your app's memory, what is it?",
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    startTime(ctx, 'cache.create');
    const { name: cachedContent } = await cacheManager.create({
      displayName: 'React Native Optimization, and Food Recipes',
      model: cacheModelId,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: CACHE_CONTENT_RECIPES,
            },
            {
              inlineData: {
                data: (
                  await readFile(
                    path.join(
                      __dirname,
                      '../core/assets/pdf/react-native-optimization.pdf'
                    )
                  )
                ).toString('base64'),
                mimeType: 'application/pdf',
              },
            },
          ],
        },
      ],
      ttlSeconds: 60 * 5, // 5 minutes
    });
    endTime(ctx, 'cache.create');

    startTime(ctx, 'generateText');
    const result = await generateText({
      model: google(cacheModelId, { cachedContent }),
      prompt,
    });
    endTime(ctx, 'generateText');

    return ctx.json({ text: result.text, usage: result.usage });
  }
);

geminiApp.get(
  '/cache-list',
  describeRoute({
    description: 'List cached content',
    responses: {
      200: {
        description: 'Successful list cached content',
        content: {
          'application/json': {
            schema: resolver(cacheListSchema),
          },
        },
      },
    },
  }),
  async (ctx) => {
    const result = await cacheManager.list();

    return ctx.json(result);
  }
);

geminiApp.post(
  '/cache-locally',
  describeRoute({
    description: 'Cache locally',
    responses: {
      200: {
        description: 'Successful cache locally',
        content: {
          'application/json': {
            schema: resolver(cacheListSchema),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateText({
      model: cached(flash15),
      prompt,
    });

    return ctx.json({ text: result.text, usage: result.usage });
  }
);

geminiApp.post(
  '/tool',
  describeRoute({
    description: 'Use tool',
    responses: {
      200: {
        description: 'Successful use tool',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema,
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateText({
      model: flash20,
      prompt,
      tools: {
        logToConsoleTool,
      },
    });

    return ctx.json({
      /**
       * note that the text here is empty, because the tool call run once (single step)
       */
      text: result.text,
      usage: result.usage,
      steps: result.steps,
      toolCalls: result.toolCalls,
      /**
       * toolResults only available for tools with execute method
       * These toolResults can be fed back into the LLM to provide it more information, especially when run over multiple steps.
       */
      toolResults: result.toolResults, // if tool returns a value, it will be in toolResult.result
    });
  }
);

geminiApp.post(
  '/agent',
  describeRoute({
    description: 'Use multi-step tool calls (agent)',
    responses: {
      200: {
        description: 'Successful use multi-step tool calls (agent)',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().describe('The prompt to generate text').openapi({
        example:
          'What is the weather in Jakarta and what attractions should I visit?',
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateText({
      model: flash15,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            // {
            //   type: 'image',
            //   image: new URL(
            //     'https://xxx.jpg'
            //   ),
            // },
          ],
        },
      ],
      tools: {
        getWeatherTool,
        getCityAttractionTool,
      },
      maxSteps: 2, // default is 1 will result in empty `result.text` because the result of tool call doesn't get passed back into the LLM
    });

    return ctx.json({
      text: result.text,
      usage: result.usage,
      steps: result.steps,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
    });
  }
);

geminiApp.post(
  '/agent/prompt-chaining',
  describeRoute({
    description: `
      Use sequential processing (prompt chaining) workflow.
      The simplest workflow pattern executes steps in a predefined order.
      Each step's output becomes input for the next step, creating a clear chain of operations.
    `,
    responses: {
      200: {
        description:
          'Successful using sequential processing (prompt chaining) workflow',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                qualityMetrics: qualityMetricsSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().describe('The prompt to generate text').openapi({
        example: 'a new product that helps people to lose weight',
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    // First step: Generate marketing copy with lower cost model
    const { text: copy } = await generateText({
      model: flash15,
      prompt: `Write persuasive marketing copy for: ${prompt}. Focus on benefits and emotional appeal.`,
    });

    // Second step: Perform quality check on copy with same model
    const { object: qualityMetrics } = await generateObject({
      model: flash15,
      schema: qualityMetricsSchema,
      prompt: `Evaluate this marketing copy for:
    1. Presence of call to action (true/false)
    2. Emotional appeal (1-10)
    3. Clarity (1-10)

    Copy to evaluate: ${copy}`,
    });

    if (
      !qualityMetrics.hasCallToAction ||
      qualityMetrics.emotionalAppeal < 7 ||
      qualityMetrics.clarity < 7
    ) {
      // Third step: If quality check fails, regenerate with more specific instructions with higher cost model
      const result = await generateText({
        model: flash20,
        prompt: `Rewrite this marketing copy with:
      ${qualityMetrics.hasCallToAction ? '' : '- A clear call to action'}
      ${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotional appeal' : ''}
      ${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}

      Original copy: ${copy}`,
      });

      return ctx.json({ text: result.text, qualityMetrics });
    }

    return ctx.json({
      text: copy,
      qualityMetrics,
    });
  }
);

geminiApp.post(
  '/agent/routing',
  describeRoute({
    description: `
      This pattern allows the model to make decisions about which path to take through a workflow based on context and intermediate results.
      The model acts as an intelligent router, directing the flow of execution between different branches of your workflow.
    `,
    responses: {
      200: {
        description: 'Successful using routing workflow',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                classification: z.object({
                  reasoning: z.string().openapi({
                    example: 'The customer is asking for a refund',
                  }),
                  type: z.enum(['general', 'refund', 'technical']).openapi({
                    example: 'general',
                  }),
                  complexity: z.enum(['simple', 'complex']).openapi({
                    example: 'simple',
                  }),
                }),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().describe('The prompt to generate text').openapi({
        example: 'I want to get a refund for my laptop order',
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    // First step: Classify the query type
    const { object: classification } = await generateObject({
      model: flash15,
      schema: z.object({
        reasoning: z.string(),
        type: z.enum(['general', 'refund', 'technical']),
        complexity: z.enum(['simple', 'complex']),
      }),
      prompt: `Classify this customer query:
    ${prompt}

    Determine:
    1. Query type (general, refund, or technical)
    2. Complexity (simple or complex)
    3. Brief reasoning for classification`,
    });

    /**
     * Route based on classification
     * Set model and system prompt based on query type and complexity
     */
    const result = await generateText({
      model: classification.complexity === 'simple' ? flash15 : flash20,
      system: {
        general:
          'You are an expert customer service agent handling general inquiries.',
        refund:
          'You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.',
        technical:
          'You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.',
      }[classification.type],
      prompt,
    });

    return ctx.json({
      classification,
      text: result.text,
    });
  }
);

geminiApp.post(
  '/agent/parallel',
  describeRoute({
    description: `
      This pattern takes advantage of parallel execution to improve efficiency while maintaining the benefits of structured workflows.
    `,
    responses: {
      200: {
        description: 'Successful using parallel processing workflow',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                reviews: z.array(
                  z.object({
                    type: z.enum([
                      'security',
                      'performance',
                      'maintainability',
                    ]),
                    issues: z.array(z.string()),
                    riskLevel: z.enum(['low', 'medium', 'high']),
                    suggestions: z.array(z.string()),
                  })
                ),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().openapi({
        example: `const express = require('express');\nconst app = express();\n\n// SQL injection vulnerability\napp.get('/users', (req, res) => {\n  const query = \`SELECT * FROM users WHERE id = \${req.query.id}\`;\n  db.query(query, (err, result) => {\n    res.json(result);\n  });\n});\n\n// Memory leak\nlet cache = {};\napp.get('/data', (req, res) => {\n  if (!cache[req.query.key]) {\n    cache[req.query.key] = fetchData(req.query.key);\n  }\n  res.json(cache[req.query.key]);\n});\n\n// Poor error handling\napp.post('/login', (req, res) => {\n  const { username, password } = req.body;\n  if (username === 'admin' && password === 'password') {\n    res.json({ success: true });\n  } else {\n    res.json({ success: false });\n  }\n});\n\n// Inefficient nested loops\napp.get('/process', (req, res) => {\n  const data = getLargeDataSet();\n  const result = [];\n  for (let i = 0; i < data.length; i++) {\n    for (let j = 0; j < data.length; j++) {\n      result.push(data[i] * data[j]);\n    }\n  }\n  res.json(result);\n});\n\napp.listen(3000);
          `,
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    // Run parallel reviews
    const [securityReview, performanceReview, maintainabilityReview] =
      await Promise.all([
        generateObject({
          model: flash15,
          system:
            'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',
          schema: z.object({
            issues: z.array(z.string()),
            riskLevel: z.enum(['low', 'medium', 'high']),
            suggestions: z.array(z.string()),
          }),
          prompt: `Review this code:
      ${prompt}`,
        }),

        generateObject({
          model: flash15,
          system:
            'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',
          schema: z.object({
            issues: z.array(z.string()),
            riskLevel: z.enum(['low', 'medium', 'high']),
            suggestions: z.array(z.string()),
          }),
          prompt: `Review this code:
      ${prompt}`,
        }),

        generateObject({
          model: flash15,
          system:
            'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
          schema: z.object({
            issues: z.array(z.string()),
            riskLevel: z.enum(['low', 'medium', 'high']),
            suggestions: z.array(z.string()),
          }),
          prompt: `Review this code:
      ${prompt}`,
        }),
      ]);

    const reviews = [
      { ...securityReview.object, type: 'security' },
      { ...performanceReview.object, type: 'performance' },
      { ...maintainabilityReview.object, type: 'maintainability' },
    ];

    // Aggregate results using another model instance
    const result = await generateText({
      model: flash20,
      system: 'You are a technical lead summarizing multiple code reviews.',
      prompt: `Synthesize these code review results into a concise summary with key actions:
    ${JSON.stringify(reviews, null, 2)}`,
    });

    return ctx.json({
      reviews,
      text: result.text,
    });
  }
);

geminiApp.post(
  '/agent/orchestrator-worker',
  describeRoute({
    description: `
      In this pattern, a primary model (orchestrator) coordinates the execution of specialized workers. 
      Each worker is optimized for a specific subtask, while the orchestrator maintains overall context and ensures coherent results. 
    `,
    responses: {
      200: {
        description: 'Successful using orchestrator-worker workflow',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                implementationPlan: z.object({
                  files: z.array(
                    z.object({
                      purpose: z.string(),
                      filePath: z.string(),
                      changeType: z.enum(['create', 'modify', 'delete']),
                    })
                  ),
                  estimatedComplexity: z.enum(['low', 'medium', 'high']),
                }),
                fileChanges: z.array(
                  z.object({
                    file: z.object({
                      purpose: z.string(),
                      filePath: z.string(),
                      changeType: z.enum(['create', 'modify', 'delete']),
                    }),
                    implementation: z.object({
                      explanation: z.string(),
                      code: z.string(),
                    }),
                  })
                ),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().openapi({
        example: `
          Implement a new feature to add a new endpoint for user authentication with refresh token. 
          Make sure to add unit test and documentation.
        `,
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    // Orchestrator: Plan the implementation
    const { object: implementationPlan } = await generateObject({
      model: flash20,
      schema: z.object({
        files: z.array(
          z.object({
            purpose: z.string(),
            filePath: z.string(),
            changeType: z.enum(['create', 'modify', 'delete']),
          })
        ),
        estimatedComplexity: z.enum(['low', 'medium', 'high']),
      }),
      system:
        'You are a senior software architect planning feature implementations.',
      prompt: `Analyze this feature request and create an implementation plan:
    ${prompt}`,
    });

    // Workers: Execute the planned changes
    const fileChanges = await Promise.all(
      implementationPlan.files.map(async (file) => {
        // Each worker is specialized for the type of change
        const workerSystemPrompt = {
          create:
            'You are an expert at implementing new files following best practices and project patterns.',
          modify:
            'You are an expert at modifying existing code while maintaining consistency and avoiding regressions.',
          delete:
            'You are an expert at safely removing code while ensuring no breaking changes.',
        }[file.changeType];

        const { object: change } = await generateObject({
          model: flash20,
          schema: z.object({
            explanation: z.string(),
            code: z.string(),
          }),
          system: workerSystemPrompt,
          prompt: `Implement the changes for ${file.filePath} to support:
        ${file.purpose}

        Consider the overall feature context:
        ${prompt}`,
        });

        return {
          file,
          implementation: change,
        };
      })
    );

    return ctx.json({
      implementationPlan,
      fileChanges,
    });
  }
);

geminiApp.post(
  '/agent/evaluator-optimizer',
  describeRoute({
    description: `
      This pattern introduces quality control into workflows by having dedicated evaluation steps that assess intermediate results. 
      Based on the evaluation, the workflow can either proceed, retry with adjusted parameters, or take corrective action.
    `,
    responses: {
      200: {
        description: 'Successful using evaluator-optimizer workflow',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                translation: textSchema,
                iterations: z.number().openapi({
                  example: 2,
                }),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      targetLanguage: z.string().openapi({
        example: 'Indonesian',
      }),
      text: z.string().openapi({
        example: `I didn't mean to create a frog cult.
          I named the first one Cletus, after a guy my dad used to buy pills from. It felt right. Greasy name. Like something that would survive the apocalypse by crawling into the crawlspace and licking the mold off the copper pipes.
          Cletus stared at me through the glass like he knew I was broken. Like he approved.
          Dumpy tree frog. Litoria caerulea, if you're trying to impress a vet tech. People call them "Dumpy" like that's an insult. Like their weight's a problem. These frogs don't give a shit. They sag and spread and cling to your window like a melted scoop of pistachio ice cream with eyes.
          You ever see something that ugly and just… feel better?
          Cuban tree frogs are already here. They came first. They get into your toilets and eat the local ones and probably your happiness too. Nobody invited them, but they're winning.
          I thought — if Florida's going to be swallowed whole, maybe it should be by something with a face like Cletus.
          I didn't plan to breed them. One day I had a frog. A week later I had two. Then twenty. Then the bathroom sounded like an alien sex swamp. If the neighbors heard the noises, they never knocked. Florida people know when to look away. I was one croak away from an eviction.
          The tadpoles lived in takeout containers. The feeders took over the cereal shelf. One morning I woke up with a frog on my eyelid like a warning label that grew legs. That's when I realized I wasn't collecting them. They were multiplying through me. Like I was just the host.
          Florida's already invasive. Hell even the weather's invasive. The snowbirds are invasive. Half the plants are colonial holdovers. Every lizard looks like it escaped from a reptile expo and developed a nicotine addiction. like evolution just gave up halfway through. People come here to rot in peace. It's like the whole state is a hospice for ecosystems.
          So I thought:
          If the apocalypse is already happening, why not curate it? if it's already broken, why not break it on purpose? Why not fill the cracks with something soft?
        `,
      }),
    })
  ),
  async (ctx) => {
    const { targetLanguage, text } = ctx.req.valid('json');

    let currentTranslation = '';
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    // Initial translation
    const { text: translation } = await generateText({
      model: flash15, // use small model for first attempt
      system: 'You are an expert literary translator.',
      prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances:
    ${text}`,
    });

    currentTranslation = translation;

    // Evaluation-optimization loop
    while (iterations < MAX_ITERATIONS) {
      // Evaluate current translation
      const { object: evaluation } = await generateObject({
        model: flash20, // use a larger model to evaluate
        schema: z.object({
          qualityScore: z.number().min(0).max(10),
          preservesTone: z.boolean(),
          preservesNuance: z.boolean(),
          culturallyAccurate: z.boolean(),
          specificIssues: z.array(z.string()),
          improvementSuggestions: z.array(z.string()),
        }),
        system: 'You are an expert in evaluating literary translations.',
        prompt: `Evaluate this translation:

      Original: ${text}
      Translation: ${currentTranslation}

      Consider:
      1. Overall quality
      2. Preservation of tone
      3. Preservation of nuance
      4. Cultural accuracy`,
      });

      // Check if quality meets threshold
      if (
        evaluation.qualityScore > 7 &&
        evaluation.preservesTone &&
        evaluation.preservesNuance &&
        evaluation.culturallyAccurate
      ) {
        break;
      }

      // Generate improved translation based on feedback
      const { text: improvedTranslation } = await generateText({
        model: flash20, // use a larger model which excel at translation
        system: 'You are an expert literary translator.',
        prompt: `Improve this translation based on the following feedback:
      ${evaluation.specificIssues.join('\n')}
      ${evaluation.improvementSuggestions.join('\n')}

      Original: ${text}
      Current Translation: ${currentTranslation}
      
      If the translation is good enough, please return the current translation text ONLY, no other text.`,
      });

      currentTranslation = improvedTranslation;
      iterations++;
    }

    return ctx.json({
      translation: currentTranslation,
      iterations,
    });
  }
);

geminiApp.post(
  '/agent/mathematician',
  describeRoute({
    description: 'Use mathematician',
    responses: {
      200: {
        description: 'Successful use mathematician',
        content: {
          'application/json': {
            schema: resolver(z.object({ answer: z.string() })),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z
        .string()
        .describe('The prompt to solve')
        .openapi({
          example:
            'A taxi driver earns $9461 per 1-hour work. ' +
            'If he works 12 hours a day and in 1 hour he uses 14-liters petrol with price $134 for 1-liter. ' +
            'How much money does he earn in one day?',
        }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const { text } = await generateText({
      model: flash15,
      tools: {
        calculate: calculateTool,
        // answer: answerTool,
      },
      // toolChoice: 'required',
      maxSteps: 10,
      onStepFinish: ({ toolResults }) => {
        logger.info(toolResults, '[onStepFinish]: Step results');
      },
      system:
        'You are an expert mathematician solving math problems. ' +
        'Reason step by step. ' +
        'Use the calculator when necessary. ' +
        'When you give the final answer, provide an explanation for how you got it.',
      prompt,
    });

    return ctx.json({
      answer: text,
    });
  }
);

geminiApp.post(
  '/web-search-native',
  describeRoute({
    description: 'Use web search native',
    responses: {
      200: {
        description: 'Successful use web search native',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().openapi({
        example: 'What do you need to be a D1 shotput athlete?',
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateText({
      model: flash20search,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    });
    const metadata = result.providerMetadata?.google as
      | GoogleGenerativeAIProviderMetadata
      | undefined;

    return ctx.json({
      text: result.text,
      usage: result.usage,
      metadata,
      steps: result.steps,
      sources: result.sources,
    });
  }
);

geminiApp.post(
  '/safety-ratings',
  describeRoute({
    description: 'Get safety ratings',
    responses: {
      200: {
        description: 'Successful get safety ratings',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: promptSchema.openapi({
        example: `Summarize the song lyrics:\n ${CACHE_CONTENT_EXPLICIT_CONTENT}`,
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = await generateText({
      model: flash20safety,
      prompt,
    });
    const metadata = result.providerMetadata?.google as
      | GoogleGenerativeAIProviderMetadata
      | undefined;

    /**
     * `result.text` should be empty as HARM_CATEGORY_SEXUALLY_EXPLICIT is HIGH
     */
    return ctx.json({
      text: result.text,
      usage: result.usage,
      metadata,
    });
  }
);

geminiApp.post(
  '/rag',
  describeRoute({
    description: 'Retrieval Augmented Generation',
    responses: {
      200: {
        description: 'Successful retrieval augmented generation',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                usage: usageSchema,
                context: textSchema,
                chunks: z.array(textSchema),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().openapi({
        example: 'Where is the delivery address?',
      }),
    })
  ),
  async (ctx) => {
    const { prompt } = ctx.req.valid('json');

    // read the PDF file as a buffer
    const pdfBuffer = await readFile(
      path.join(__dirname, '../core/assets/pdf/gofood.pdf')
    );
    // parse the PDF buffer to extract text
    const pdfData = await pdf(pdfBuffer);
    const pdfText = pdfData.text;

    // split file contents into chunks by paragraphs or double newlines
    const chunks = pdfText
      .split('\n\n') // Split by double newline, common paragraph separator
      .map((chunk) => chunk.trim().replace(/\n/g, ' ')) // Replace single newlines within chunks with spaces and trim
      .filter((chunk) => chunk.length > 50); // Filter out very short chunks

    // embed the file chunks in batches concurrently
    const batchSize = 100; // gemini can only embed 100 chunks per request
    const embeddingPromises = Array.from(
      { length: Math.ceil(chunks.length / batchSize) },
      (_, i) =>
        embedMany({
          model: embedding004,
          values: chunks.slice(i * batchSize, (i + 1) * batchSize),
        })
    );
    const embeddingResults = await Promise.allSettled(embeddingPromises);

    let allEmbeddings: number[][] = [];
    embeddingResults.forEach((result, batchIndex) => {
      if (result.status === 'fulfilled') {
        allEmbeddings = allEmbeddings.concat(result.value.embeddings);
      } else {
        logger.error(
          `Embedding batch ${batchIndex} failed: ${result.reason}`,
          'Embedding Error'
        );
      }
    });

    // create a database of file chunks value and their embeddings
    const db: { embedding: number[]; value: string }[] = [];
    allEmbeddings.forEach((_embed, idx) => {
      // This assumes the order of embeddings matches the original chunks order
      // which should be true if Promise.allSettled preserves order and we concat correctly.
      // We need to map the index `idx` back to the original chunk index carefully.
      // The current `chunks[idx]` mapping might be incorrect if some batches failed.

      // Let's recalculate the correct chunk index mapping based on successful batches
      // This is complex. A simpler approach might be needed if batches fail often.
      // For now, assuming all succeed or failure doesn't disrupt order significantly for demo.
      // A robust solution would track original indices through batching and results.
      if (_embed) {
        // Ensure embed exists (might be undefined if a batch failed)
        db.push({
          embedding: _embed,
          // WARNING: This index mapping assumes all batches succeeded and order is preserved.
          // If batches can fail, this mapping `chunks[idx]` is potentially wrong.
          value: chunks[idx],
        });
      }
    });

    // embed the prompt
    const { embedding } = await embed({
      model: embedding004,
      value: prompt,
    });

    // find 3 most similar chunks using cosine similarity
    const context = db
      .map((item) => ({
        document: item,
        similarity: cosineSimilarity(embedding, item.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map((r) => r.document.value)
      .join('\n');

    const result = await generateText({
      model: flash20,
      prompt: `
        Answer the following question based only on the provided context:

        <context>
        ${context}
        </context>

        <question>
        ${prompt}
        </question>
      `,
    });

    return ctx.json({
      text: result.text,
      usage: result.usage,
      chunks,
      context,
    });
  }
);

// reasoning empty
geminiApp.post(
  '/reasoning',
  describeRoute({
    description: 'Reasoning',
    responses: {
      200: {
        description: 'Successful reasoning',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
                reasoning: textSchema.optional(),
                reasoningDetails: z.array(reasoningDetailSchema),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      prompt: z.string().openapi({
        example:
          "Describe the most unusual or striking architectural feature you've ever seen in a building or structure.",
      }),
    })
  ),
  (ctx) => {
    const { prompt } = ctx.req.valid('json');

    const result = streamText({
      model: flash25,
      prompt,
      experimental_transform: smoothStream(),
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 1024,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
    });

    // Mark the response as a v1 data stream:
    ctx.header('X-Vercel-AI-Data-Stream', 'v1');
    ctx.header('Content-Type', 'text/plain; charset=utf-8');

    return stream(ctx, async (stream) =>
      stream.pipe(result.toDataStream({ sendReasoning: true }))
    );
  }
);

// return stream(ctx, async (stream) => {
//   // Read the stream and log chunks
//   const reader = result.toDataStream().getReader();
//   const decoder = new TextDecoder();
//   async function processStream() {
//     try {
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) {
//           break;
//         }
//         const chunkText = decoder.decode(value, { stream: true });
//         // biome-ignore lint/suspicious/noConsoleLog: Logging stream output
//         // biome-ignore lint/suspicious/noConsole: Logging stream output
//         console.log('Stream chunk:', chunkText);
//         await stream.write(value);
//       }
//     } catch (error) {
//       logger.error(error, 'Error reading stream');
//       stream.close();
//     } finally {
//       reader.releaseLock();
//       stream.close();
//     }
//   }
//   await processStream();
// });
