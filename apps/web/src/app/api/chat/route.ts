import { models, processToolCalls, tools } from '@/core/services/ai';
import { loadChat, saveChat } from '@/core/utils/filesystem';
import {
  type Message,
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  createIdGenerator,
  experimental_createMCPClient,
  smoothStream,
  streamText,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { z } from 'zod';

const systemPrompt = `
You are a helpful assistant.
You have a list of tools that you can use to help the user. 
If there is no tool to use, you should respond normally with a markdown formatted text.
`;

const deepResearchSystemPrompt = `
Do not call multiple tools at once.
Do not repeat the results of deepResearch tool calls.
You can report (max 2 sentences) that the tool has been used successfully.
`;

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
  // get the last message from the request:
  const { message, id, searchMode, deepResearchMode } = (await req.json()) as {
    message: Message;
    id: string;
    searchMode: boolean;
    deepResearchMode: boolean;
  };

  // load the previous messages from the server:
  const previousMessages = await loadChat(id);

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  // filter through messages and remove base64 image data to avoid sending too much tokens to the model (not needed if we are using object storage and the data is an url)
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

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const combinedTools = {
        ...mcpTools,
        generateImage: tools.generateImage,
        getWeatherInformation: tools.getWeatherInformation, // no execute function, human in the loop
        ...(searchMode && {
          webSearchNative: tools.webSearchNative(dataStream),
        }),
        ...(deepResearchMode && {
          webSearch: tools.webSearch,
          deepResearch: tools.deepResearch(dataStream),
        }),
      };

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

      let startTime: number | null = null;

      const result = streamText({
        model,
        messages: processedMessages,
        system: deepResearchMode ? deepResearchSystemPrompt : systemPrompt,
        tools: combinedTools,
        experimental_activeTools: searchMode
          ? ['webSearchNative']
          : deepResearchMode
            ? ['webSearch', 'deepResearch']
            : [],
        // toolCallStreaming: true, // partial tool calls will be streamed as part of the data stream enabling client "partial-tool" state
        maxSteps: 10,
        experimental_transform: smoothStream(),
        // id format for server-side messages:
        experimental_generateMessageId: createIdGenerator({
          prefix: 'msgs',
          size: 16,
        }),
        onChunk() {
          if (startTime === null) {
            startTime = Date.now();
          }
          // else {
          //   const duration = Date.now() - startTime;

          //   dataStream.writeMessageAnnotation({
          //     type: 'metadata',
          //     data: { duration },
          //   } satisfies Annotation);
          // }
        },
        async onFinish({ response }) {
          // reset the start time
          startTime = null;

          // save the chat to storage
          await saveChat({
            id,
            messages: appendResponseMessages({
              messages,
              responseMessages: response.messages,
            }),
          });

          // we can save the message and the response to storage here
          await mcpClient.close();
        },
      });

      // forward the initial result to the client without the finish event:
      // result.mergeIntoDataStream(dataStream, {
      //   sendReasoning: true,
      //   experimental_sendFinish: false, // omit the finish event
      // });

      // to ensure it runs to completion & triggers onFinish even when the client aborted (e.g. by closing the browser tab or because of a network issue):
      result.consumeStream(); // no await

      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      if (error == null) {
        return 'unknown error';
      }

      if (typeof error === 'string') {
        return error;
      }

      if (error instanceof Error) {
        return error.message;
      }

      return JSON.stringify(error);
    },
  });
}
