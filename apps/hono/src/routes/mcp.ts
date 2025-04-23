import { promptSchema, textSchema } from '@/core/api/ai';
import type { Variables } from '@/core/types/hono';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '@workspace/core/utils/logger';
import { experimental_createMCPClient, streamText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import { stream } from 'hono/streaming';
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
const flash20 = google('gemini-2.0-flash-001');
const flash20search = google('gemini-2.0-flash-001', {
  // don't use dynamic retrieval, it's only for 1.5 models and old-fashioned
  useSearchGrounding: true,
});
const pro25 = google('gemini-2.5-pro-exp-03-25');
const embedding004 = google.textEmbeddingModel('text-embedding-004');

export const mcpApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

// can't run the mcp with bun
mcpApp.post(
  '/mcp',
  describeRoute({
    description: 'Model Context Protocol',
    responses: {
      200: {
        description: 'Successful use Model Context Protocol',
        content: {
          'text/plain': {
            schema: resolver(textSchema),
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

    try {
      // Initialize an MCP client to connect to a `stdio` MCP server:
      const transport = new Experimental_StdioMCPTransport({
        command: 'dotenvx run -- tsx',
        args: ['./src/core/mcp/sequentialthinking.ts'],
      });
      const stdioClient = await experimental_createMCPClient({
        transport,
      });

      // Alternatively, you can connect to a Server-Sent Events (SSE) MCP server:
      const sseClient = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: 'https://actions.zapier.com/mcp/[YOUR_KEY]/sse',
        },
      });

      // Similarly to the stdio example, you can pass in your own custom transport as long as it implements the `MCPTransport` interface:
      // const transport = new MyCustomTransport({
      //   // ...
      // });
      // const customTransportClient = await experimental_createMCPClient({
      //   transport,
      // });

      const toolSetOne = await stdioClient.tools();
      const toolSetTwo = await sseClient.tools();
      // const toolSetThree = await customTransportClient.tools();

      const result = streamText({
        model: flash20,
        tools: {
          ...toolSetOne,
          ...toolSetTwo,
          // ...toolSetThree, // note: this approach causes subsequent tool sets to override tools with the same name
        },
        prompt,
        // When streaming, the client should be closed after the response is finished:
        onFinish: async () => {
          await stdioClient.close();
          await sseClient.close();
          // await customTransportClient.close();
        },
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
    } catch (error) {
      return ctx.body(JSON.stringify(error), 500);
    }
  }
);
