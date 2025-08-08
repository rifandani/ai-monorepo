import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { logger } from '@workspace/core/utils/logger';
import {
  type CoreMessage,
  experimental_createMCPClient,
  generateText,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { z as z3 } from 'zod/v3';
import { models } from '@/core/api/ai.js';
import { ENV } from '@/core/constants/env.js';
import type { Variables } from '@/core/types/hono.js';
import { fileToDataUri } from '@/core/utils/converter.js';

export function mcpClientRoutes(
  app: OpenAPIHono<{
    Variables: Variables;
  }>
) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/mcp-client',
      summary: 'MCP Client',
      description:
        'MCP Client using gemini 2.0 flash which communicates with /mcp server endpoint',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().describe('User prompt').openapi({
                  example: 'Give me details about Pikachu',
                }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully communicated with /mcp server endpoint',
          content: {
            'application/json': {
              schema: z.object({
                markdown: z.string().openapi({
                  example: '# Hello World',
                }),
              }),
            },
          },
        },
      },
    }),
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
            parameters: z3.object({
              interval: z3
                .number()
                .describe('Interval in milliseconds between notifications')
                .default(100),
              count: z3
                .number()
                .describe('Number of notifications to send (0 for 100)')
                .default(10),
            }),
          },
          'get-pokemon': {
            parameters: z3.object({
              name: z3.string().describe('The name of the Pokemon to get'),
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/mcp-client/markitdown',
      summary: 'MCP Client: Markitdown',
      description:
        'MCP Client using gemini 2.0 flash which communicates with Markitdown MCP Server. Markitdown is a tool that uses the Markitdown python package which helps you convert various resources in different formats into Markdown.',
      request: {
        body: {
          content: {
            'multipart/form-data': {
              /**
               * ERROR:
               * "message": "Unknown zod object type, please specify `type` and other OpenAPI props using `ZodSchema.openapi`.",
               *
               * we can't use `z.instanceof(File)` or `z.instanceof(Blob)` or `z.file()` because it's not supported by `@hono/zod-openapi@beta`.
               * that's why we use `c.req.parseBody()` to parse the body.
               */
              schema: z.object({
                prompt: z.string().describe('User prompt').openapi({
                  example: 'Where is the delivery address?',
                }),
                // file: z.file().describe('The file to convert to Markdown'),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully converted to Markdown',
          content: {
            'application/json': {
              schema: z.object({
                markdown: z.string().openapi({
                  example: '# Hello World',
                }),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      const { prompt } = c.req.valid('form');
      const { file } = await c.req.parseBody();

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
            parameters: z3.object({
              uri: z3
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
            content: `${prompt}\n<data_uri>${await fileToDataUri(file as File)}</data_uri>`,
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

  app.get('/mcp-client', (c) => {
    logger.log('Received GET MCP request');
    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32_000,
          message: 'Method not allowed.',
        },
        id: null,
      },
      { status: 405 }
    );
  });

  app.delete('/mcp-client', (c) => {
    logger.log('Received DELETE MCP request');
    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32_000,
          message: 'Method not allowed.',
        },
        id: null,
      },
      { status: 405 }
    );
  });
}
