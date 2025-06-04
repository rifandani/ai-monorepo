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
      command: 'docker',
      args: ['run', '--rm', '-i', 'markitdown-mcp:latest'],
    });

    mcpClient = await experimental_createMCPClient({
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

    const { text: answer } = await generateText({
      model: flash20,
      tools,
      maxSteps: 10,
      system:
        "You are a helpful assistant. Keep your responses concise and helpful. You can use the convert_to_markdown tool to convert a resource (in various formats like .pdf, .docx, .pptx, etc.) in base64 data uri format into markdown. If the user provides a data uri, proceed to use the convert_to_markdown tool without user confirmation to convert it into markdown and then answer the user's prompt.",
      messages: [
        {
          role: 'user',
          // content: `${prompt}\n<data_uri>${await fileToDataUri(file)}</data_uri>`,
          content:
            'Summarize the following resource\n<data_uri>https://www.sitereportpro.co.uk/download/legal-standard-3-main-street/?wpdmdl=2120</data_uri>',
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

    console.log(`FINAL ANSWER: ${answer}`);
  } finally {
    // @ts-ignore
    await mcpClient?.close();
  }
}

main().catch(console.error);
