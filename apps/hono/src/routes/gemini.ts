import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type GoogleGenerativeAIProviderMetadata,
  type GoogleGenerativeAIProviderOptions,
  google,
} from '@ai-sdk/google';
import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import {
  type CoreMessage,
  cosineSimilarity,
  createDataStream,
  embed,
  embedMany,
  type FilePart,
  // type FilePart,
  generateObject,
  generateText,
  type ImagePart,
  // type ImagePart,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';
import { stream } from 'hono/streaming';
import { endTime, startTime } from 'hono/timing';
import { extractText, getDocumentProxy } from 'unpdf';
import { z as z3 } from 'zod/v3';
import {
  cacheManager,
  cacheModelId,
  embeddingSchema,
  embeddingUsageSchema,
  fileSchema,
  gofoodSchema,
  gofoodSchemaV3,
  implementationPlanFileSchema,
  implementationPlanImplementationSchema,
  implementationPlanImplementationSchemaV3,
  implementationPlanSchema,
  implementationPlanSchemaV3,
  mockUserSchema,
  mockUserSchemaV3,
  models,
  multimodalRequestSchema,
  // multimodalRequestFormdataSchema,
  promptSchema,
  qualityMetricsSchema,
  qualityMetricsSchemaV3,
  reviewCodeSchemaV3,
  textSchema,
  usageSchema,
} from '@/core/api/ai';
import { CACHE_CONTENT_EXPLICIT_CONTENT } from '@/core/constants/cache';
import type { Variables } from '@/core/types/hono';
import { Logger } from '@/core/utils/logger';
import { cached } from '@/core/utils/middleware';
import {
  answerTool,
  calculateTool,
  getCityAttractionTool,
  getWeatherTool,
  logToConsoleTool,
} from '@/core/utils/tool';

const logger = new Logger('geminiEndpoint');

export function geminiRoutes(
  app: OpenAPIHono<{
    Variables: Variables;
  }>
) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/generate',
      summary: 'Generate text',
      description: 'Generate text using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: promptSchema,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Generated text',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      const { prompt } = c.req.valid('json');

      /**
       * Sometimes you need the AI to act in a certain way no matter what prompt it receives.
       * Something like giving it a role, direction, or a certain set of instructions.
       * Or any other additional data/context that you want to provide to the AI, so that it could know what to do.
       */
      const system = 'Answer in pirate language';
      /**
       * It's pretty common if you're building any kind of chat bot to want to keep track of the conversation history.
       * This is so the LLM has context over the conversation you've already had.
       * So you can ask follow-up questions without having to rephrase your question every time.
       */
      const messages: CoreMessage[] = [
        {
          role: 'system',
          content: system,
        },
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
        /**
         * we can hot swap the model with like openai, anthropic, etc.
         * no major breaking changes, just change the model.
         */
        model: models.flash25,
        messages,
        // system,
        // prompt,
      });
      const response = {
        text: result.text,
        usage: result.usage,
        messages: result.response.messages,
      };

      return c.json(response);
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/generate-image',
      summary: 'Generate image',
      description: 'Generate image using gemini flash 2.0 exp',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example: 'A beautiful sunset over a calm ocean',
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful generating image',
          content: {
            'application/json': {
              schema: z.object({
                files: z.array(fileSchema),
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = await generateText({
        model: models.flash20exp,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/multimodal',
      summary: 'Multimodal',
      description:
        'Generate response from multimodal input using gemini flash 2.5',
      request: {
        body: {
          content: {
            'multipart/form-data': {
              /**
               * ERROR:
               * "message": "Unknown zod object type, please specify `type` and other OpenAPI props using `ZodSchema.openapi`.",
               *
               * we can't use `z.instanceof(File)` or `z.instanceof(Blob)` or `z.file()` because it's not supported by `@hono/zod-openapi@beta`.
               * that's why we use `c.req.parseBody()` to parse the body.
               */
              schema: multimodalRequestSchema.pick({
                prompt: true,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful generate response from multimodal input',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      const { prompt } = c.req.valid('form');
      const { image, pdf, audio } = await c.req.parseBody();

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
                    image: await (image as File).arrayBuffer(),
                    mimeType: (image as File).type,
                  } as ImagePart,
                ]
              : []),
            ...(pdf
              ? [
                  {
                    type: 'file',
                    data: await (pdf as File).arrayBuffer(),
                    mimeType: 'application/pdf',
                  } as FilePart,
                ]
              : []),
            ...(audio
              ? [
                  {
                    type: 'file',
                    data: await (audio as File).arrayBuffer(),
                    mimeType: (audio as File).type,
                  } as FilePart,
                ]
              : []),
          ],
        },
      ];

      const result = await generateText({
        model: models.flash25,
        messages,
      });

      return c.json({
        text: result.text,
        usage: result.usage,
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/multimodal-object',
      summary: 'Multimodal: Structured Output',
      description:
        'Generate structured output response from multimodal input using gemini flash 2.5. Please use gofood pdf file as i define the schema especially for it. If we want to support image and audio, we should adjust the schema accordingly.',
      request: {
        body: {
          content: {
            'multipart/form-data': {
              /**
               * ERROR:
               * "message": "Unknown zod object type, please specify `type` and other OpenAPI props using `ZodSchema.openapi`.",
               *
               * we can't use `z.instanceof(File)` or `z.instanceof(Blob)` or `z.file()` because it's not supported by `@hono/zod-openapi@beta`.
               * that's why we use `c.req.parseBody()` to parse the body.
               */
              schema: multimodalRequestSchema.pick({
                prompt: true,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful generate response from multimodal input',
          content: {
            'application/json': {
              schema: z.object({
                object: gofoodSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      const { prompt } = c.req.valid('form');
      const { pdf } = await c.req.parseBody();

      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            ...(pdf
              ? [
                  {
                    type: 'file',
                    data: await (pdf as File).arrayBuffer(),
                    mimeType: 'application/pdf',
                  } as FilePart,
                ]
              : []),
          ],
        },
      ];

      const result = await generateObject({
        model: models.flash25,
        messages,
        schema: gofoodSchemaV3,
      });

      return c.json({
        object: result.object,
        usage: result.usage,
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/stream',
      summary: 'Stream text',
      description: 'Stream text chunked per line using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: promptSchema,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful stream text',
          // content: {
          //   'text/plain': {
          //     schema: textSchema,
          //   },
          // },
        },
      },
    }),
    (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = streamText({
        model: models.flash25,
        prompt,
        experimental_transform: smoothStream({
          delayInMs: 20, // optional: defaults to 10ms
          chunking: 'line', // optional: defaults to 'word'
        }),
      });

      // Mark the response as a v1 data stream (for AI SDK UI client)
      ctx.header('X-Vercel-AI-Data-Stream', 'v1');
      ctx.header('Content-Type', 'text/plain; charset=utf-8');

      // use the `toDataStream` method to get a data stream
      return stream(ctx, (_stream) => _stream.pipe(result.textStream));
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/stream-data',
      summary: 'Stream data',
      description: 'Stream data using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: promptSchema,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful stream data',
          // content: {
          //   'text/plain': {
          //     schema: textSchema,
          //   },
          // },
        },
      },
    }),
    (ctx) => {
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
            model: models.flash25,
            prompt,
            experimental_transform: smoothStream(),
          });

          result.mergeIntoDataStream(dataStreamWriter);
        },
        onError: (error) => {
          // Error messages are masked by default for security reasons.
          // If you want to expose the error message to the client, you can do so here:
          return error instanceof Error ? error.message : String(error);
        },
      });

      // Mark the response as a v1 data stream (for AI SDK client)
      ctx.header('X-Vercel-AI-Data-Stream', 'v1');
      ctx.header('Content-Type', 'text/plain; charset=utf-8');

      return stream(ctx, (_stream) =>
        _stream.pipe(dataStream.pipeThrough(new TextEncoderStream()))
      );
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/stream-object',
      summary: 'Stream object',
      description: 'Stream object using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example: 'Generate 3 detailed user profiles',
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful stream object',
          // content: {
          //   'text/plain': {
          //     schema: textSchema,
          //   },
          // },
        },
      },
    }),
    (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = streamObject({
        model: models.flash25,
        prompt,
        schema: z3
          .array(mockUserSchemaV3)
          .describe('Array of user profiles')
          .min(1)
          .max(3),
        onFinish({ object, error }) {
          // handle type validation failure (when the object does not match the schema):
          if (!object) {
            logger.error('Stream object error', {
              error: (error as Error).message,
            });
            return;
          }
        },
      });

      // Mark the response as a v1 data stream (for AI SDK client)
      ctx.header('X-Vercel-AI-Data-Stream', 'v1');
      ctx.header('Content-Type', 'text/plain; charset=utf-8');

      return stream(ctx, (_stream) => {
        return _stream.pipe(result.textStream);
        // or use fullStream to get different types of events, including partial objects, errors, and finish events
        // for await (const objectPart of result.partialObjectStream) {
        //   await _stream.write(JSON.stringify(objectPart));
        //   // await _stream.writeln('');
        // }
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/object',
      summary: 'Structured output',
      description: 'Structured output using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example: 'Generate a detailed user profile',
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful structured output',
          content: {
            'application/json': {
              schema: z.object({
                object: mockUserSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = await generateObject({
        model: models.flash25,
        prompt,
        schema: mockUserSchemaV3,
      });

      return ctx.json({
        object: result.object,
        usage: result.usage,
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/object/classify',
      summary: 'Structured output: Classifier',
      description:
        'Classify the sentiment of the text as positive, negative, or neutral',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example:
                    'Well now, the winds be neither fair nor foul today, just fillin the sails enough to keep us movin. The stores be holdin out, mind ye, not overflowin with grog and plunder, but enough to keep a body from starvin.',
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful classify text',
          content: {
            'application/json': {
              schema: z.object({
                sentiment: z
                  .enum(['positive', 'negative', 'neutral'])
                  .describe('The sentiment of the text'),
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = await generateObject({
        model: models.flash25,
        system:
          'Classify the sentiment of the text as positive, negative, or neutral',
        prompt,
        schema: z3.object({
          sentiment: z3
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/cache-create',
      summary: 'Cache create',
      description: 'Explicitly cache an input using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example:
                    "When we hunting memory leaks with React Native DevTools, React Native DevTools offers three ways to profile your app's memory, what is it?",
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful cache an input',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      startTime(ctx, 'cache.create');
      const { name: cachedContent } = await cacheManager.create({
        displayName: 'React Native Optimization',
        model: cacheModelId,
        contents: [
          {
            role: 'user',
            parts: [
              // {
              //   text: CACHE_CONTENT_RECIPES,
              // },
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

  app.openapi(
    createRoute({
      method: 'get',
      path: '/gemini/cache-list',
      summary: 'Cache list',
      description: 'List cached content using gemini',
      responses: {
        200: {
          description: 'Successful list cached content',
          // content: {
          //   'application/json': {
          //     schema: cacheListSchema,
          //   },
          // },
        },
      },
    }),
    async (ctx) => {
      const result = await cacheManager.list();

      return ctx.json(result);
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/cache-locally',
      summary: 'Cache local',
      description: 'Cache locally using AI SDK middleware',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: promptSchema,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful cache locally',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = await generateText({
        model: cached(models.flash25),
        prompt,
      });

      return ctx.json({ text: result.text, usage: result.usage });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/tool',
      summary: 'Tools',
      description: 'Use tool using AI SDK',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe('The prompt to generate text')
                  .openapi({
                    /**
                     * this will result to -> "I'm sorry, I don't have the information about the capital of Japan. I can only use the tools available to me."
                     * this is because the LLM only focus on the provided tools
                     * for LLM to use the tool while also support general conversation, we need to instruct using system prompt
                     */
                    // example: 'What is the capital of Japan?',
                    example: 'Log this message: What is the capital of Japan?',
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful use tool',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      // const system = `
      //   You are a helpful assistant that can answer questions and use tools to get information.
      //   If there is no tool to use, you should respond normally by answering the question.
      // `;

      /**
       * Function calling lets you connect models to external tools and APIs.
       * Instead of generating text responses, the model understands when to call specific functions and provides the necessary parameters to execute real-world actions.
       * This allows the model to act as a bridge between natural language and real-world actions and data.
       * - Augment Knowledge: Access information from external sources like databases, APIs, and knowledge bases.
       * - Extend Capabilities: Use external tools to perform computations and extend the limitations of the model, such as using a calculator or creating charts.
       * - Take Actions: Interact with external systems using APIs, such as scheduling appointments, creating invoices, sending emails, or controlling smart home devices
       */
      const result = await generateText({
        model: models.flash20,
        prompt,
        // system,
        tools: {
          /**
           * the LLM itself does not execute the tool, but rather our server, that's why we can see the console log in our server, not in google server
           */
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent',
      summary: 'Agent',
      description: 'Use multi-step tool calls (agent) using AI SDK',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe('The prompt to generate text')
                  .openapi({
                    example:
                      'What is the weather in Jakarta and what attractions should I visit?',
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful use multi-step tool calls (agent)',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ];

      /**
       * Aside from tool calls to do things in the world,
       * LLMs can also react to the information they receive from their tools.
       * This can create a powerful feedback loop where the LLM is continually grounding itself in the real world.
       * And this feedback loop is what most people, including Anthropic, call "agents".
       */
      const result = await generateText({
        model: models.flash20,
        messages,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/prompt-chaining',
      summary: 'Agent: Prompt Chaining',
      description: `
      Use sequential processing (prompt chaining) workflow.
      The simplest workflow pattern executes steps in a predefined order.
      Each step's output becomes input for the next step, creating a clear chain of operations.
      This workflow is ideal for situations where the task can be easily and cleanly decomposed into fixed subtasks.
      The main goal is to trade off latency for higher accuracy, by making each LLM call an easier task.
    `,
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe('The prompt to generate text')
                  .openapi({
                    example: 'a new product that helps people to lose weight',
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'Successful using sequential processing (prompt chaining) workflow',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                qualityMetrics: qualityMetricsSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      // First step: Generate marketing copy with lower cost model
      const { text: copy } = await generateText({
        model: models.flash20,
        prompt: `Write persuasive marketing copy for: ${prompt}. Focus on benefits and emotional appeal.`,
      });

      // Second step: Perform first quality check on copy with same model
      const { object: qualityMetrics } = await generateObject({
        model: models.flash20,
        schema: qualityMetricsSchemaV3,
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
          model: models.flash25,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/routing',
      summary: 'Agent: Routing',
      description: `
      This pattern allows the model to make decisions about which path to take through a workflow based on context and intermediate results.
      The model acts as an intelligent router, directing the flow of execution between different branches of your workflow.
      Routing works well for complex tasks where there are distinct categories that are better handled separately,
      and where classification can be handled accurately, either by an LLM or a more traditional classification model/algorithm.
    `,
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe('The prompt to generate text')
                  .openapi({
                    example: 'I want to get a refund for my laptop order',
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful using routing workflow',
          content: {
            'application/json': {
              schema: z.object({
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
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      // First step: Classify the query type
      const { object: classification } = await generateObject({
        model: models.flash25,
        schema: z3.object({
          reasoning: z3.string().describe('Brief reasoning for classification'),
          type: z3
            .enum(['general', 'refund', 'technical'])
            .describe('Query type'),
          complexity: z3
            .enum(['simple', 'complex'])
            .describe('Complexity of the query'),
        }),
        prompt: `Classify this customer query: ${prompt}`,
      });

      /**
       * Route based on classification
       * Set model and system prompt based on query type and complexity
       */
      const result = await generateText({
        model:
          classification.complexity === 'simple'
            ? models.flash20
            : models.flash25,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/parallel',
      summary: 'Agent: Parallel',
      description: `
      This pattern takes advantage of parallel execution to improve efficiency while maintaining the benefits of structured workflows.
      Parallelization is effective when the divided subtasks can be parallelized for speed, or when multiple perspectives or attempts are needed for higher confidence results.
      For complex tasks with multiple considerations, LLMs generally perform better when each consideration is handled by a separate LLM call, allowing focused attention on each specific aspect.
    `,
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example: `const express = require('express');\nconst app = express();\n\n// SQL injection vulnerability\napp.get('/users', (req, res) => {\n  const query = \`SELECT * FROM users WHERE id = \${req.query.id}\`;\n  db.query(query, (err, result) => {\n    res.json(result);\n  });\n});\n\n// Memory leak\nlet cache = {};\napp.get('/data', (req, res) => {\n  if (!cache[req.query.key]) {\n    cache[req.query.key] = fetchData(req.query.key);\n  }\n  res.json(cache[req.query.key]);\n});\n\n// Poor error handling\napp.post('/login', (req, res) => {\n  const { username, password } = req.body;\n  if (username === 'admin' && password === 'password') {\n    res.json({ success: true });\n  } else {\n    res.json({ success: false });\n  }\n});\n\n// Inefficient nested loops\napp.get('/process', (req, res) => {\n  const data = getLargeDataSet();\n  const result = [];\n  for (let i = 0; i < data.length; i++) {\n    for (let j = 0; j < data.length; j++) {\n      result.push(data[i] * data[j]);\n    }\n  }\n  res.json(result);\n});\n\napp.listen(3000);
          `,
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful using parallel processing workflow',
          // content: {
          //   'application/json': {
          //     schema: z.object({
          //       text: textSchema,
          //       reviews: z.array(
          //         reviewCodeSchema.extend({
          //           type: z
          //             .enum(['security', 'performance', 'maintainability'])
          //             .describe('Type of the issue'),
          //         })
          //       ),
          //     }),
          //   },
          // },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      // Run parallel reviews
      const [securityReview, performanceReview, maintainabilityReview] =
        await Promise.all([
          generateObject({
            model: models.flash25,
            system:
              'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',
            schema: reviewCodeSchemaV3,
            prompt: `Review this code:
      ${prompt}`,
          }),

          generateObject({
            model: models.flash25,
            system:
              'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',
            schema: reviewCodeSchemaV3,
            prompt: `Review this code:
      ${prompt}`,
          }),

          generateObject({
            model: models.flash25,
            system:
              'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
            schema: reviewCodeSchemaV3,
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
        model: models.flash25,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/orchestrator-worker',
      summary: 'Agent: Orchestrator Worker',
      description: `
      In this pattern, a primary model (orchestrator) coordinates the execution of specialized workers.
      Each worker is optimized for a specific subtask, while the orchestrator maintains overall context and ensures coherent results.

      This workflow is well-suited for complex tasks where you can't predict the subtasks needed
      (in coding, for example, the number of files that need to be changed and the nature of the change in each file likely depend on the task).
      Whereas it's topographically similar, the key difference from parallelization is its flexibility—subtasks aren't pre-defined,
      but determined by the orchestrator based on the specific input.
    `,
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example: `
          Implement a new feature to add a new endpoint for user authentication with refresh token.
          Make sure to add unit test and documentation.
        `,
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful using orchestrator-worker workflow',
          content: {
            'application/json': {
              schema: z.object({
                implementationPlan: implementationPlanSchema,
                fileChanges: z.array(
                  z.object({
                    file: implementationPlanFileSchema,
                    implementation: implementationPlanImplementationSchema,
                  })
                ),
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      // Orchestrator: Plan the implementation
      const { object: implementationPlan } = await generateObject({
        model: models.flash25,
        schema: implementationPlanSchemaV3,
        system:
          'You are a senior software architect planning feature implementations.',
        prompt: `Analyze this feature request and create an implementation plan:
    ${prompt}`,
      });

      // Workers: Execute the dynamically-generated planned changes (imagine like cursor composer)
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
            model: models.flash25,
            schema: implementationPlanImplementationSchemaV3,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/evaluator-optimizer',
      summary: 'Agent: Evaluator Optimizer',
      description: `
      This pattern introduces quality control into workflows by having dedicated evaluation steps that assess intermediate results.
      Based on the evaluation, the workflow can either proceed, retry with adjusted parameters, or take corrective action.

      This workflow is particularly effective when we have clear evaluation criteria, and when iterative refinement provides measurable value.
      The two signs of good fit are, first, that LLM responses can be demonstrably improved when a human articulates their feedback; and second, that the LLM can provide such feedback.
      This is analogous to the iterative writing process a human writer might go through when producing a polished document.
    `,
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
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
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful using evaluator-optimizer workflow',
          content: {
            'application/json': {
              schema: z.object({
                translation: textSchema,
                iterations: z.number().openapi({
                  example: 2,
                }),
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { targetLanguage, text } = ctx.req.valid('json');

      let currentTranslation = '';
      let iterations = 0;
      const MAX_ITERATIONS = 3;

      // Initial translation
      const { text: initialTranslation } = await generateText({
        model: models.flash20, // you can use small model for first attempt
        system: 'You are an expert literary translator.',
        prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances:
    ${text}`,
      });

      // set the initial translation as the current translation
      currentTranslation = initialTranslation;

      // Evaluation-optimization loop
      while (iterations < MAX_ITERATIONS) {
        // Evaluate current translation
        const { object: evaluation } = await generateObject({
          model: models.flash25, // you can use a larger model to evaluate
          schema: z3.object({
            qualityScore: z3.number().min(0).max(100),
            preservesTone: z3.boolean(),
            preservesNuance: z3.boolean(),
            culturallyAccurate: z3.boolean(),
            specificIssues: z3.array(z3.string()),
            improvementSuggestions: z3.array(z3.string()),
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
          evaluation.qualityScore > 70 &&
          evaluation.preservesTone &&
          evaluation.preservesNuance &&
          evaluation.culturallyAccurate
        ) {
          break; // done, the translation is good enough
        }

        // Generate improved translation based on feedback
        const { text: improvedTranslation } = await generateText({
          model: models.flash25, // use a larger model which excel at translation
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/agent/mathematician',
      summary: 'Agent: Mathematician',
      description: 'Use mathematician using mathjs',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe('The prompt to solve')
                  .openapi({
                    example:
                      'A taxi driver earns $9461 per 1-hour work. ' +
                      'If he works 12 hours a day and in 1 hour he uses 14-liters petrol with price $134 for 1-liter. ' +
                      'How much money does he earn in one day?',
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful use mathematician',
          // content: {
          //   'application/json': {
          //     schema: z.object({ answer: z.string() }),
          //   },
          // },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const { text, steps } = await generateText({
        model: models.flash20, // flash25 doesn't work
        tools: {
          calculate: calculateTool,
          answer: answerTool,
        },
        // toolChoice: 'required',
        maxSteps: 10,
        system:
          'You are an expert mathematician solving math problems. ' +
          'Reason step by step. ' +
          'Use the calculator when necessary. ' +
          'When you give the final answer, provide an explanation for how you got it.',
        prompt,
      });

      return ctx.json({
        answer: text,
        steps,
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/web-search-native',
      summary: 'Web search native',
      description: 'Use web search native using gemini flash 2.0 search',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example: 'What do you need to be a D1 shotput athlete?',
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful use web search native',
          // content: {
          //   'application/json': {
          //     schema: z.object({
          //       text: textSchema,
          //       usage: usageSchema,
          //     }),
          //   },
          // },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ];

      const result = await generateText({
        // the model should support web search tool natively
        model: models.flash20search, // flash25search is also supported
        messages,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/safety-ratings',
      summary: 'Safety ratings',
      description: 'Get safety ratings using gemini flash 2.0 safety',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe('The prompt with explicit content')
                  .openapi({
                    example: `Summarize the song lyrics:\n ${CACHE_CONTENT_EXPLICIT_CONTENT}`,
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful get safety ratings',
          // content: {
          //   'application/json': {
          //     schema: z.object({
          //       text: textSchema,
          //       usage: usageSchema,
          //     }),
          //   },
          // },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = await generateText({
        // make sure the model support safety ratings
        model: models.flash20safety,
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/embed',
      summary: 'Embedding',
      description: 'Embed text using gemini embedding 004',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: promptSchema,
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful embed text',
          content: {
            'application/json': {
              schema: z.object({
                embedding: embeddingSchema,
                usage: embeddingUsageSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      /**
       * Embeddings are numerical representations of text (or other media formats) that capture relationships between inputs.
       * Text embeddings work by converting text into arrays of floating point numbers, called vectors.
       * The length of the embedding array is called the vector's dimensionality.
       */
      const result = await embed({
        model: models.embedding004,
        value: prompt,
      });

      return ctx.json({
        embedding: result.embedding,
        usage: result.usage,
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/embed-many',
      summary: 'Embedding many',
      description: 'Embed many texts using gemini embedding 004',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z
                  .string()
                  .describe(
                    'The text query to match the predefined values. The query will be embedded and compared to the predefined values.'
                  )
                  .openapi({
                    example: 'Hamburger',
                  }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful embed many texts',
          content: {
            'application/json': {
              schema: z.object({
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
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const searchTermResult = await embed({
        model: models.embedding004,
        value: prompt,
      });

      const predefinedValues = [
        'Foods',
        'Drinks',
        'Animals',
        'Transportations',
        'Cities',
        'Countries',
      ];
      // result index is same as predefinedValues index
      const result = await embedMany({
        model: models.embedding004,
        values: predefinedValues,
      });

      const vector = result.embeddings.map((embedding, index) => ({
        prompt: predefinedValues[index],
        embedding,
        /**
         * A high value (close to 1) indicates that the vectors are very similar, while a low value (close to -1) indicates that they are different.
         */
        distance: cosineSimilarity(searchTermResult.embedding, embedding),
      }));

      return ctx.json({
        vector,
        usage: result.usage,
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/rag',
      summary: 'RAG',
      description:
        'Retrieval Augmented Generation based on react-native-optimization.pdf file using gemini',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  // example: 'Where is the delivery address?',
                  example:
                    "When we hunting memory leaks with React Native DevTools, React Native DevTools offers three ways to profile your app's memory, what is it?",
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful retrieval augmented generation',
          content: {
            'application/json': {
              schema: z.object({
                text: textSchema,
                usage: usageSchema,
                chunks: z.array(textSchema),
                context: textSchema,
              }),
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      // read the PDF file as a buffer
      const pdfBuffer = await readFile(
        // path.join(__dirname, '../core/assets/pdf/gofood.pdf') // simple pdf
        path.join(__dirname, '../core/assets/pdf/react-native-optimization.pdf') // large pdf
      );

      // parse the PDF buffer to extract text
      // const pdfData = await pdf(pdfBuffer);
      // const pdfText = pdfData.text;

      // load the PDF file into a PDF.js document
      const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
      const { text } = await extractText(pdf, { mergePages: true });

      // split file contents into chunks by paragraphs or double newlines
      const chunks = text
        .split('\n\n') // Split by double newline, common paragraph separator
        .map((chunk) => chunk.trim().replace(/\n/g, ' ')) // Replace single newlines within chunks with spaces and trim
        .filter((chunk) => chunk.length > 30); // Filter out very short chunks

      // embed the file chunks in batches concurrently
      const batchSize = 100; // gemini can only embed 100 chunks per request
      const embeddingPromises = Array.from(
        { length: Math.ceil(chunks.length / batchSize) },
        (_, i) =>
          embedMany({
            model: models.embedding004,
            values: chunks.slice(i * batchSize, (i + 1) * batchSize),
          })
      );
      const embeddingResults = await Promise.allSettled(embeddingPromises);

      let allEmbeddings: number[][] = [];
      embeddingResults.forEach((_result, batchIndex) => {
        if (_result.status === 'fulfilled') {
          allEmbeddings = allEmbeddings.concat(_result.value.embeddings);
        } else {
          logger.error(`Embedding batch ${batchIndex} failed`, {
            error: _result.reason,
          });
        }
      });

      // create a database of file chunks value and their embeddings
      const db: { embedding: number[]; value: string }[] = [];
      allEmbeddings.forEach((_embed, idx) => {
        // This assumes the order of embeddings matches the original chunks order
        // which should be true if Promise.allSettled preserves order and we concat correctly.
        // We need to map the index `idx` back to the original chunk index carefully.
        // The current `chunks[idx]` mapping might be incorrect if some batches failed.

        if (_embed) {
          // Ensure embed exists (might be undefined if a batch failed)
          db.push({
            embedding: _embed,
            // NOTE: This index mapping assumes all batches succeeded and order is preserved.
            // A robust solution would track original indices through batching and results.
            // If batches can fail, this mapping `chunks[idx]` is potentially wrong.
            value: chunks[idx],
          });
        }
      });

      // embed the prompt
      const { embedding } = await embed({
        model: models.embedding004,
        value: prompt,
      });

      // find 3 most similar chunks using cosine similarity
      const context = db
        .map((item) => ({
          document: item,
          similarity: cosineSimilarity(embedding, item.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3) // top 3
        .map((r) => r.document.value)
        .join('\n');

      const result = await generateText({
        model: models.flash25,
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

  // idk, reasoning is empty
  app.openapi(
    createRoute({
      method: 'post',
      path: '/gemini/reasoning',
      summary: 'Reasoning',
      description: 'Reasoning using gemini flash 2.5 with thinking',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().openapi({
                  example:
                    "Describe the most unusual or striking architectural feature you've ever seen in a building or structure.",
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful reasoning',
        },
      },
    }),
    (ctx) => {
      const { prompt } = ctx.req.valid('json');

      const result = streamText({
        model: models.flash25,
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

      // Mark the response as a v1 data stream (for AI SDK client)
      ctx.header('X-Vercel-AI-Data-Stream', 'v1');
      ctx.header('Content-Type', 'text/plain; charset=utf-8');

      return stream(ctx, async (_stream) =>
        _stream.pipe(result.toDataStream({ sendReasoning: true }))
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
    }
  );
}
