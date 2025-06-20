import type { Variables } from '@/core/types/hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { toFetchResponse, toReqRes } from 'fetch-to-node';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

const POKE_API_BASE = 'https://pokeapi.co/api/v2';

interface PokemonAbility {
  id: string;
  name: string;
}

interface Pokemon {
  id: string;
  name: string;
  abilities: { ability: PokemonAbility }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

async function makePokeApiRequest<T>(path: string): Promise<T | null> {
  try {
    const url = `${POKE_API_BASE}${path}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error('[ERROR] Failed to make PokeAPI request:', error);
    return null;
  }
}

function formatPokemonData(pokemon: Pokemon) {
  return [
    `Name: ${pokemon.name}`,
    `Abilities: ${pokemon.abilities
      .map((ability) => ability.ability.name)
      .join(', ')}`,
    `Stats: ${pokemon.stats
      .map((stat) => `${stat.stat.name}: ${stat.base_stat}`)
      .join(', ')}`,
  ].join('\n');
}

export const mcpApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

/**
 * @link read more for deployment to CF https://github.dev/mhart/mcp-hono-stateless
 */
const getServer = () => {
  // Create an MCP server with implementation details
  const server = new McpServer(
    {
      name: 'stateless-streamable-http-server',
      version: '1.0.0',
    },
    // this is required, because we use `sendNotification` in the tool
    { capabilities: { logging: {} } }
  );

  // Register a simple prompt
  server.prompt(
    'greeting-template',
    'A simple greeting prompt template',
    {
      name: z.string().describe('Name to include in greeting'),
    },
    // biome-ignore lint/suspicious/useAwait: <explanation>
    async ({ name }): Promise<GetPromptResult> => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please greet ${name} in a friendly manner.`,
            },
          },
        ],
      };
    }
  );

  // Create a simple resource at a fixed URI
  server.resource(
    'greeting-resource',
    'https://example.com/greetings/default',
    { mimeType: 'text/plain' },
    // biome-ignore lint/suspicious/useAwait: <explanation>
    async (): Promise<ReadResourceResult> => {
      return {
        contents: [
          {
            uri: 'https://example.com/greetings/default',
            text: 'Hello, world!',
          },
        ],
      };
    }
  );

  // Register a tool specifically for testing resumability
  server.tool(
    'start-notification-stream',
    'Starts sending periodic notifications for testing resumability',
    {
      interval: z
        .number()
        .describe('Interval in milliseconds between notifications')
        .default(100),
      count: z
        .number()
        .describe('Number of notifications to send (0 for 100)')
        .default(10),
    },
    async (
      { interval, count },
      { sendNotification }
    ): Promise<CallToolResult> => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      let counter = 0;

      while (count === 0 || counter < count) {
        counter++;
        try {
          await sendNotification({
            method: 'notifications/message',
            params: {
              level: 'info',
              data: `Periodic notification #${counter} at ${new Date().toISOString()}`,
            },
          });
        } catch (error) {
          console.error('Error sending notification:', error);
        }
        // Wait for the specified interval
        await sleep(interval);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Started sending periodic notifications every ${interval}ms`,
          },
        ],
      };
    }
  );

  server.tool(
    'get-pokemon',
    'Get Pokemon details by name',
    {
      name: z.string().describe('The name of the Pokemon to get'),
    },
    async ({ name }) => {
      const path = `/pokemon/${name.toLowerCase()}`;
      const pokemon = await makePokeApiRequest<Pokemon>(path);

      if (!pokemon) {
        return {
          content: [
            {
              type: 'text',
              text: 'Failed to retrieve Pokemon data',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: formatPokemonData(pokemon),
          },
        ],
      };
    }
  );

  return server;
};

mcpApp.post(
  '/',
  describeRoute({
    description:
      'Streamable HTTP MCP. By default, the server will start an SSE stream, instead of returning JSON responses.',
    responses: {
      200: {
        description: 'Successful streamable HTTP MCP',
      },
    },
  }),
  async (c) => {
    // Node.js-compatible request and response objects for WinterTC (fetch-like) runtimes, such as Cloudflare Workers, Bun, Deno and Fastly Compute.
    const { req, res } = toReqRes(c.req.raw);

    const server = getServer();

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // for oauth
        // eventStore, // enable resumability
      });

      await server.connect(transport);

      // should be after connect and before handleRequest -> Client error: DOMException [AbortError]: This operation was aborted
      // transport.onmessage = (message) => {
      //   console.log('Message', message);
      // };
      await transport.handleRequest(req, res, await c.req.json());

      res.on('close', () => {
        console.log('Request closed');
        transport.close();
        server.close();
      });

      return toFetchResponse(res);
    } catch (e) {
      console.error(e);
      return c.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        },
        { status: 500 }
      );
    }
  }
);

mcpApp.get('/', (c) => {
  console.log('Received GET MCP request');
  return c.json(
    {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    },
    { status: 405 }
  );
});

mcpApp.delete('/', (c) => {
  console.log('Received DELETE MCP request');
  return c.json(
    {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    },
    { status: 405 }
  );
});
