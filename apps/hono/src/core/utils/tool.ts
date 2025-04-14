import { tool } from 'ai';
import { z } from 'zod';

/**
 * the LLM itself does not execute the tool, but rather our server, that's why we can see the console log in our server, not in google server
 */
export const logToConsoleTool = tool({
  description: 'Log a message to the console',
  parameters: z.object({
    message: z.string().describe('The message to log to console'),
  }),
  execute: async ({ message }) => {
    // biome-ignore lint/suspicious/useAwait: aaa
    // biome-ignore lint/suspicious/noConsoleLog: aaa
    // biome-ignore lint/suspicious/noConsole: aaa
    console.log('logToConsoleTool: ', message);
  },
});

export const getWeatherTool = tool({
  description:
    'Get the weather in a location. Use it only when the user asks for the weather.',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});

export const getCityAttractionTool = tool({
  description: 'Get the attractions in a city',
  parameters: z.object({
    city: z.string().describe('The city to get the attractions for'),
  }),
  // biome-ignore lint/suspicious/useAwait: <explanation>
  execute: async ({ city }: { city: string }) => {
    if (city === 'Jakarta') {
      return {
        attractions: [
          'Monumen Nasional',
          'Taman Fatahillah',
          'Kota Tua',
          'Kelenteng Tjoe Hwie Kiong',
        ],
      };
    }

    return { attractions: [] };
  },
});
