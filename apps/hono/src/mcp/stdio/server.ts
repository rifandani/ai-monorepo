import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type {
  GetPromptResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

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

const server = new McpServer(
  {
    name: 'pokemon',
    version: '1.0.0',
  },
  {
    instructions: 'You can directly use the tool, prompt, and resource',
  }
);

// Register a prompt template
server.prompt(
  'greeting-prompt',
  'A simple greeting from pikachu',
  {
    name: z.string().describe('Pokemon name to include in greeting'),
  },
  // biome-ignore lint/suspicious/useAwait: <explanation>
  async ({ name }): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Pika pika! Pi pii ppii pi, ${name} ⚡️`,
          },
        },
      ],
    };
  }
);

// Create a simple resource at a fixed URI
server.resource(
  'moves-resource',
  'https://pikapika.com/moves',
  {
    description: 'A simple moves resource from pikachu',
  },
  // biome-ignore lint/suspicious/useAwait: <explanation>
  async (): Promise<ReadResourceResult> => {
    return {
      contents: [
        {
          uri: 'https://pikapika.com/moves',
          text: 'Thunderbolt ⚡️',
        },
      ],
    };
  }
);

// Register a tool
server.tool(
  'get-pokemon',
  'Get Pokemon details by name',
  {
    name: z.string(),
  },
  async ({ name }) => {
    /**
     * beware of `console.log` usage, the client will read it and it doesn't comply with the JSON-RPC spec
     */
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
