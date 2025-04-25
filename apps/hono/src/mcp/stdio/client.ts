import { google } from '@ai-sdk/google';
import { experimental_createMCPClient, generateText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { z } from 'zod';

const pro25 = google('gemini-2.5-pro-exp-03-25');

async function main() {
  let mcpClient: Awaited<ReturnType<typeof experimental_createMCPClient>>;

  try {
    // using StdioClientTransport from @modelcontextprotocol/sdk -> Error: spawn node ENOENT
    const stdioTransport = new Experimental_StdioMCPTransport({
      command: 'node',
      args: ['./src/mcp/stdio/dist/server.js'],
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
          parameters: z.object({ name: z.string() }),
        },
      },
    });

    const { text: answer } = await generateText({
      model: pro25,
      tools,
      maxSteps: 10,
      onStepFinish: async ({ toolResults }) => {
        console.log(`STEP RESULTS: ${JSON.stringify(toolResults, null, 2)}`);
      },
      system: 'You are an expert in Pokemon',
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
