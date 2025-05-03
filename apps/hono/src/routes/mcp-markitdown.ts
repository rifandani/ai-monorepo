import { models } from '@/core/api/ai';
import type { Variables } from '@/core/types/hono';
import { fileToDataUri } from '@/core/utils/converter';
import { experimental_createMCPClient, generateText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

export const mcpMarkitdownApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

// doesn't work
mcpMarkitdownApp.post(
  '/',
  describeRoute({
    description:
      'Markitdown is a tool that uses the Markitdown python package which helps you convert various resources in different formats into Markdown.',
    responses: {
      200: {
        description: 'Successful conversion to Markdown',
        content: {
          'application/json': {
            schema: z.object({
              markdown: z.string(),
            }),
          },
        },
      },
    },
  }),
  validator(
    'form',
    z.object({
      prompt: z.string().describe('User prompt').openapi({
        example: 'Summarize the following resource',
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
      model: models.pro25,
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
