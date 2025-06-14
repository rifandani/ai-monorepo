import {
  embeddingsSchema,
  modelSchema,
  promptSchema,
  textSchema,
} from '@/core/api/ai';
import type { Variables } from '@/core/types/hono';
import { logger } from '@workspace/core/utils/logger';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import { streamText } from 'hono/streaming';
import ollama, { type Message } from 'ollama';
import { z } from 'zod';
// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

export const ollamaApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

ollamaApp.get(
  '/list',
  describeRoute({
    description: 'Get the list of available models',
    responses: {
      200: {
        description: 'Successful get the list of available models',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                models: z.array(modelSchema).openapi({
                  example: ['phi4-mini:3.8b', 'gemma3:4b'],
                }),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const { models } = await ollama.list();

    return c.json({
      models,
    });
  }
);

ollamaApp.get(
  '/pull/:model',
  describeRoute({
    description: 'Pull/download a model',
    responses: {
      200: {
        description: 'Successful pull/download a model',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                model: modelSchema,
              })
            ),
          },
        },
      },
    },
  }),
  zValidator('param', modelSchema),
  (c) => {
    const model = c.req.valid('param');

    return streamText(c, async (stream) => {
      await stream.writeln(`downloading ${model}...`);

      const pullStream = await ollama.pull({ model, stream: true });

      for await (const part of pullStream) {
        if (part.digest) {
          let percent = 0;
          if (part.completed && part.total) {
            percent = Math.round((part.completed / part.total) * 100);
          }
          await stream.writeln(`${part.status} ${percent}%...`);
        } else {
          await stream.writeln(JSON.stringify(part));
        }
      }
    });
  }
);

ollamaApp.post(
  '/stream',
  describeRoute({
    description: 'Generate text stream',
    responses: {
      200: {
        description: 'Successful generate text stream',
        content: {
          'text/plain': {
            schema: resolver(z.string()),
          },
        },
      },
    },
  }),
  zValidator(
    'json',
    z.object({
      model: modelSchema.optional(),
      prompt: promptSchema,
    })
  ),
  async (c) => {
    const { model = 'phi4-mini:3.8b', prompt } = c.req.valid('json');

    const response = await ollama.generate({
      model,
      prompt,
      stream: true,
    });

    return streamText(c, async (stream) => {
      for await (const part of response) {
        await stream.write(part.response);

        if (part.done) {
          await stream.writeln('');
          await stream.write(JSON.stringify(part, null, 2));
        }
      }
    });
  }
);

ollamaApp.post(
  '/multimodal',
  describeRoute({
    description: 'Generate text with multimodal input',
    responses: {
      200: {
        description: 'Successful generate text with multimodal input',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: textSchema,
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
      image: z.instanceof(File).optional(),
    })
  ),
  async (c) => {
    const { prompt, image } = c.req.valid('form');
    const images = image ? [Buffer.from(await image.arrayBuffer())] : undefined;

    const response = await ollama.generate({
      model: 'gemma3:4b',
      prompt,
      images,
      stream: true,
    });

    return streamText(c, async (stream) => {
      for await (const part of response) {
        await stream.write(part.response);

        if (part.done) {
          await stream.writeln('');
          await stream.write(JSON.stringify(part, null, 2));
        }
      }
    });
  }
);

ollamaApp.post(
  '/embed',
  describeRoute({
    description: 'Generate embeddings for text',
    responses: {
      200: {
        description: 'Successful generate embeddings for text',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                embeddings: embeddingsSchema,
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
      prompt: promptSchema.or(z.array(promptSchema)),
    })
  ),
  async (c) => {
    const { prompt } = c.req.valid('json');

    const response = await ollama.embed({
      model: 'nomic-embed-text:latest',
      input: prompt,
    });

    return c.json({
      embeddings: response.embeddings,
    });
  }
);

// Simulates an API call to get flight times
// In a real application, this would fetch data from a live database or API
function getFlightTimes(args: { departure: string; arrival: string }) {
  // this is where you would validate the arguments you received
  const departure = args.departure;
  const arrival = args.arrival;

  const flights = {
    'LGA-LAX': {
      departure: '08:00 AM',
      arrival: '11:30 AM',
      duration: '5h 30m',
    },
    'LAX-LGA': {
      departure: '02:00 PM',
      arrival: '10:30 PM',
      duration: '5h 30m',
    },
    'LHR-JFK': {
      departure: '10:00 AM',
      arrival: '01:00 PM',
      duration: '8h 00m',
    },
    'JFK-LHR': {
      departure: '09:00 PM',
      arrival: '09:00 AM',
      duration: '7h 00m',
    },
    'CDG-DXB': {
      departure: '11:00 AM',
      arrival: '08:00 PM',
      duration: '6h 00m',
    },
    'DXB-CDG': {
      departure: '03:00 AM',
      arrival: '07:30 AM',
      duration: '7h 30m',
    },
  };

  const key = `${departure}-${arrival}`.toUpperCase();
  return JSON.stringify(flights[key] || { error: 'Flight not found' });
}

ollamaApp.post(
  '/chat',
  describeRoute({
    description: 'Chat with a flight agent',
    responses: {
      200: {
        description: 'Successful chat with a flight agent',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                message: textSchema,
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
  async (c) => {
    const { prompt } = c.req.valid('json');
    // Initialize conversation with a user query
    const messages: Message[] = [{ role: 'user', content: prompt }];

    const response = await ollama.chat({
      model: 'phi4-mini:3.8b',
      messages,
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_flight_times',
            description: 'Get the flight times between two cities',
            parameters: {
              type: 'object',
              properties: {
                departure: {
                  type: 'string',
                  description: 'The departure city (airport code)',
                },
                arrival: {
                  type: 'string',
                  description: 'The arrival city (airport code)',
                },
              },
              required: ['departure', 'arrival'],
            },
          },
        },
      ],
    });

    // Add the model's response to the conversation history
    messages.push(response.message);

    // Check if the model decided to use the provided function
    if (
      !response.message.tool_calls ||
      response.message.tool_calls.length === 0
    ) {
      logger.log(
        "The model didn't use the function. Its response was:",
        response.message.content
      );
      return;
    }

    // Process function calls made by the model
    if (response.message.tool_calls) {
      const availableFunctions = {
        get_flight_times: getFlightTimes,
      };

      for (const tool of response.message.tool_calls) {
        const functionToCall = availableFunctions[tool.function.name];
        const functionResponse = functionToCall(tool.function.arguments);

        // Add function response to the conversation
        messages.push({
          role: 'tool',
          content: functionResponse,
        });
      }
    }

    // Second API call: Get final response from the model
    const finalResponse = await ollama.chat({
      model: 'phi4-mini:3.8b',
      messages,
    });

    return c.json({
      message: finalResponse.message,
    });
  }
);
