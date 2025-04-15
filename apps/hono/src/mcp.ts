import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '@workspace/core/utils/logger';
import { experimental_createMCPClient, generateText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';

// by default use GOOGLE_GENERATIVE_AI_API_KEY
// example fetch wrapper that logs the input to the API call:
const google = createGoogleGenerativeAI({
  // @ts-expect-error preconnect is bun specific
  fetch: async (url, options) => {
    logger.info(
      { url, headers: options.headers, body: options.body },
      'FETCH_CALL'
    );
    return await fetch(url, options);
  },
});
const flash20 = google('gemini-2.0-flash-001');

let mcpClient1: Awaited<ReturnType<typeof experimental_createMCPClient>>;
let mcpClient2: Awaited<ReturnType<typeof experimental_createMCPClient>>;
// let mcpClient3: Awaited<ReturnType<typeof experimental_createMCPClient>>;

try {
  // Initialize an MCP client to connect to a `stdio` MCP server:
  const transport = new Experimental_StdioMCPTransport({
    command: 'node',
    args: ['src/stdio/dist/server.js'],
  });
  mcpClient1 = await experimental_createMCPClient({
    transport,
  });

  // Alternatively, you can connect to a Server-Sent Events (SSE) MCP server:
  mcpClient2 = await experimental_createMCPClient({
    transport: {
      type: 'sse',
      url: 'http://localhost:3000/sse',
    },
  });

  // Similarly to the stdio example, you can pass in your own custom transport as long as it implements the `MCPTransport` interface:
  // const transport = new MyCustomTransport({
  //   // ...
  // });
  // mcpClient3 = await experimental_createMCPClient({
  //   transport,
  // });

  const mcpTool1 = await mcpClient1.tools();
  const mcpTool2 = await mcpClient2.tools();
  // const toolSetThree = await mcpClient3.tools();

  const response = await generateText({
    model: flash20,
    tools: {
      ...mcpTool1,
      ...mcpTool2,
      // ...toolSetThree, // note: this approach causes subsequent tool sets to override tools with the same name
    },
    messages: [
      {
        role: 'user',
        content: 'Find products under $100',
      },
    ],
  });

  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log(response.text);
} catch (error) {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.error(error);
} finally {
  // @ts-expect-error
  await Promise.all([mcpClient1.close(), mcpClient2.close()]);
}
