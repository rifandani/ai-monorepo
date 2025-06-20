import { models } from '@/core/api/ai';
import { ENV } from '@/core/constants/env';
import type { Variables } from '@/core/types/hono';
import { fileToDataUri } from '@/core/utils/converter';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { logger } from '@workspace/core/utils/logger';
import {
  type CoreMessage,
  experimental_createMCPClient,
  generateText,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/zod';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

export const mcpClientApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

mcpClientApp.get('/', (c) => {
  logger.log('Received GET MCP request');
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

mcpClientApp.delete('/', (c) => {
  logger.log('Received DELETE MCP request');
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

mcpClientApp.post(
  '/',
  describeRoute({
    description:
      'Streamable HTTP MCP with Vercel AI SDK. By default, the server will start an SSE stream, instead of returning JSON responses.',
    responses: {
      200: {
        description: 'Successful streamable HTTP MCP',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                markdown: z.string().openapi({
                  example: '# Hello World',
                }),
              })
            ),
          },
        },
      },
    },
  }),
  validator(
    'json',
    z.object({
      prompt: z.string().describe('User prompt').openapi({
        example: 'Give me details about Pikachu',
      }),
    })
  ),
  async (c) => {
    const { prompt } = c.req.valid('json');

    const url = new URL(`${ENV.APP_URL}/mcp`);
    /**
     * It currently does not support all features of the full MCP client, such as: authorization, session management, resumable streams, and receiving notifications.
     */
    const mcpClient = await experimental_createMCPClient({
      transport: new StreamableHTTPClientTransport(url),
    });

    const tools = await mcpClient.tools({
      schemas: {
        'start-notification-stream': {
          parameters: z.object({
            interval: z
              .number()
              .describe('Interval in milliseconds between notifications')
              .default(100),
            count: z
              .number()
              .describe('Number of notifications to send (0 for 100)')
              .default(10),
          }),
        },
        'get-pokemon': {
          parameters: z.object({
            name: z.string().describe('The name of the Pokemon to get'),
          }),
        },
      },
    });

    const messages: CoreMessage[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Keep your responses concise and helpful. You can use the get-pokemon tool to get information about a Pokemon.',
      },
      {
        role: 'user',
        content: prompt,
        // content: prompt,
        // experimental_attachments: [
        //   {
        //     name: file.name,
        //     contentType: file.type,
        //     url: await fileToDataUri(file),
        //   },
        // ],
      },
    ];

    const { text } = await generateText({
      model: models.flash20, // flash25 doesn't work
      tools,
      maxSteps: 10,
      messages,
    });

    await mcpClient.close();

    return c.json({ markdown: text });
  }
);

mcpClientApp.post(
  '/markitdown',
  describeRoute({
    description:
      'Streamable HTTP MCP with Vercel AI SDK. Markitdown is a tool that uses the Markitdown python package which helps you convert various resources in different formats into Markdown.',
    responses: {
      200: {
        description: 'Successful conversion to Markdown',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                markdown: z.string().openapi({
                  example: '# Hello World',
                }),
              })
            ),
          },
        },
      },
    },
  }),
  validator(
    'form',
    z.object({
      prompt: z.string().describe('User prompt').openapi({
        example: 'Where is the delivery address?',
      }),
      file: z.instanceof(File).describe('The file to convert to Markdown'),
    })
  ),
  async (c) => {
    const { file, prompt } = c.req.valid('form');

    const stdioTransport = new Experimental_StdioMCPTransport({
      command: 'docker',
      args: ['run', '--rm', '-i', 'markitdown-mcp:latest'],
    });

    const mcpClient = await experimental_createMCPClient({
      transport: stdioTransport,
    });

    const tools = await mcpClient.tools({
      schemas: {
        convert_to_markdown: {
          parameters: z.object({
            uri: z
              .string()
              .describe(
                'The URI in which to convert the resource described by an http:, https:, file: or data: into markdown'
              ),
          }),
        },
      },
    });

    const { text } = await generateText({
      model: models.flash20, // flash25 doesn't work
      tools,
      maxSteps: 10,
      system:
        "You are a helpful assistant. Keep your responses concise and helpful. You can use the convert_to_markdown tool to convert a resource (in various formats like .pdf, .docx, .pptx, etc.) in base64 data uri format into markdown. If the user provides a data uri, proceed to use the convert_to_markdown tool without user confirmation to convert it into markdown and then answer the user's prompt.",
      messages: [
        {
          role: 'user',
          content: `${prompt}\n<data_uri>${await fileToDataUri(file)}</data_uri>`,
          // content: prompt,
          // experimental_attachments: [
          //   {
          //     name: file.name,
          //     contentType: file.type,
          //     url: await fileToDataUri(file),
          //   },
          // ],
        },
      ],
    });

    await mcpClient.close();

    return c.json({ markdown: text });
  }
);
