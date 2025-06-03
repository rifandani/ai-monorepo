import { tool } from 'ai';
import * as mathjs from 'mathjs';
import { z } from 'zod';

/**
 * the LLM itself does not execute the tool, but rather our server, that's why we can see the console log in our server, not in google server
 */
export const logToConsoleTool = tool({
  description: 'A tool for logging a message to the console',
  parameters: z.object({
    message: z.string().describe('The message to log to console'),
  }),
  execute: async ({ message }) => {
    // biome-ignore lint/suspicious/useAwait: aaa
    // biome-ignore lint/suspicious/noConsoleLog: aaa
    // biome-ignore lint/suspicious/noConsole: aaa
    console.log('logToConsoleTool: ', message);

    return {
      message: `Message logged to console: ${message}`,
    };
  },
});

export const getWeatherTool = tool({
  description:
    'A tool for getting the weather in a location. Use it only when the user asks for the weather.',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  // assume the tool actually call the weather API
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});

export const getCityAttractionTool = tool({
  description: 'A tool for getting the attractions in a city',
  parameters: z.object({
    city: z.string().describe('The city to get the attractions for'),
  }),
  // assume the tool actually call the city attraction API
  // biome-ignore lint/suspicious/useAwait: <explanation>
  execute: async ({ city }: { city: string }) => {
    if (city.toLowerCase().includes('jakarta')) {
      return {
        attractions: [
          'Monumen Nasional',
          'Taman Fatahillah',
          'Kota Tua',
          'Kelenteng Tjoe Hwie Kiong',
        ],
      };
    }

    if (city.toLowerCase().includes('balikpapan')) {
      return {
        attractions: ['Taman Bekapai', 'Pantai Manggar', 'Pantai Lamaru'],
      };
    }

    return { attractions: [] };
  },
});

export const calculateTool = tool({
  description:
    'A tool for evaluating mathematical expressions. Example expressions: ' +
    "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
  parameters: z.object({
    expression: z.string().describe('The mathematical expressions to evaluate'),
  }),
  execute: async ({ expression }) => mathjs.evaluate(expression),
});

/**
 * tool with no execute function - invoking it will terminate the agent
 */
export const answerTool = tool({
  description: 'A tool for providing the final answer.',
  parameters: z.object({
    steps: z.array(
      z.object({
        calculation: z.string().describe('The calculation'),
        reasoning: z.string().describe('The reasoning behind the calculation'),
      })
    ),
    answer: z.string().describe('The final answer to the user'),
  }),
  // no execute function - invoking it will terminate the agent
});
