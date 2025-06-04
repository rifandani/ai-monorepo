import { google } from '@ai-sdk/google';
import { experimental_createMCPClient, generateText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { z } from 'zod';

// pro-exp is no longer free
const flash20 = google('gemini-2.0-flash-001'); // stable
// const flash25 = google('gemini-2.5-flash-preview-05-20'); // previously 04-17

async function main() {
  let mcpClient: Awaited<ReturnType<typeof experimental_createMCPClient>>;

  try {
    // using StdioClientTransport from @modelcontextprotocol/sdk -> Error: spawn node ENOENT
    const stdioTransport = new Experimental_StdioMCPTransport({
      // use this if we want to build it first and run the server as javascript
      // command: 'node',
      // args: ['./src/mcp/stdio/dist/server.js'],
      // by using tsx/bun we can run the server as typescript without building it into javascript
      // command: 'npx',
      // args: ['tsx', './src/mcp/stdio/server.ts'],
      command: 'bun',
      args: ['./src/mcp/stdio/server.ts'],
      // just for example, this how we pass env variables
      env: {
        POKE_API_BASE: 'https://pokeapi.co/api/v2',
      },
    });

    mcpClient = await experimental_createMCPClient({
      transport: stdioTransport,
    });

    const tools = await mcpClient.tools({
      schemas: {
        'get-pokemon': {
          parameters: z.object({ name: z.string().describe('Pokemon name') }),
        },
      },
    });

    const { text: answer } = await generateText({
      model: flash20,
      tools,
      maxSteps: 10,
      onStepFinish: async ({ toolResults }) => {
        console.log(`STEP RESULTS: ${JSON.stringify(toolResults, null, 2)}`);
      },
      prompt:
        'Which Pokemon could best defeat Gyarados? Choose one and share details about it.',
    });

    console.log(`FINAL ANSWER: ${answer}`);
  } finally {
    // @ts-ignore
    await mcpClient?.close();
  }
}

main().catch(console.error);
