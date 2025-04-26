import { models, processToolCalls, tools } from '@/core/services/ai';
import {
  type Message,
  createDataStreamResponse,
  experimental_createMCPClient,
  smoothStream,
  streamText,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { z } from 'zod';

async function getStdioMcpClient() {
  const stdioTransport = new Experimental_StdioMCPTransport({
    command: 'node',
    args: ['../hono/src/mcp/stdio/dist/server.js'],
  });

  const mcpClient = await experimental_createMCPClient({
    transport: stdioTransport,
  });

  const tools = await mcpClient.tools({
    schemas: {
      'get-pokemon': {
        parameters: z.object({ name: z.string() }),
      },
    },
  });

  return { mcpClient, tools };
}

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Message[] };

  // filter through messages and remove base64 image data to avoid sending too much tokens to the model
  const formattedMessages = messages.map((msg) => {
    if (msg.role === 'assistant') {
      for (const ti of msg.toolInvocations ?? []) {
        if (ti.toolName === 'generateImage' && ti.state === 'result') {
          ti.result.files = [];
        }
      }

      for (const part of msg.parts ?? []) {
        if (
          part.type === 'tool-invocation' &&
          part.toolInvocation.toolName === 'generateImage' &&
          part.toolInvocation.state === 'result'
        ) {
          part.toolInvocation.result.files = [];
        }
      }
    }
    return msg;
  });

  // route model based on the user's prompt
  const model = models.flash25;

  // combined tools
  const { mcpClient, tools: mcpTools } = await getStdioMcpClient();
  const combinedTools = {
    ...mcpTools,
    generateImage: tools.generateImage,
    getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      /**
       * Utility function to handle tools that require human confirmation
       * Checks for confirmation in last message and then runs associated tool
       */
      const processedMessages = await processToolCalls(
        {
          dataStream,
          messages: formattedMessages,
          tools: combinedTools,
        },
        {
          // type-safe object for tools without an execute function
          // biome-ignore lint/suspicious/useAwait: <explanation>
          getWeatherInformation: async ({ city }) => {
            const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
            return `The weather in ${city} is ${
              conditions[Math.floor(Math.random() * conditions.length)]
            }.`;
          },
        }
      );

      const result = streamText({
        model,
        messages: processedMessages,
        system:
          'You are a helpful assistant. We have a list of tools that you can use to help the user. If there is no tool to use, you should respond normally with a text. Give the answer in markdown format.',
        tools: combinedTools,
        experimental_transform: smoothStream(),
        maxSteps: 10,
        async onFinish() {
          // we can save the message and the response to storage here
          await mcpClient.close();
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}
