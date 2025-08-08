import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTool } from '@mastra/core/tools';
import type { AnyValueMap } from '@opentelemetry/api-logs';
import { crush } from 'radashi';
import { z as v3 } from 'zod/v3';
import { OtelLogger } from '@/core/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTES_DIR = path.resolve(__dirname, '../../.notes'); // relative to the default output directory

const logger = new OtelLogger({ name: 'mastra', level: 'info' });

export const writeNoteTool = createTool({
  id: 'write',
  description: 'Write a new note or overwrite an existing one.',
  inputSchema: v3.object({
    title: v3
      .string()
      .min(1)
      .describe('The title of the note. This will be the filename.'),
    content: v3.string().min(1).describe('The markdown content of the note.'),
  }),
  outputSchema: v3.string().describe('The result of the tool execution.'),
  execute: async (ctx) => {
    logger.info('[writeNoteTool] execute', { ctx: crush(ctx) as AnyValueMap });

    try {
      // FIXME: context is undefined
      const { title, content } = ctx.context;
      const filePath = path.join(NOTES_DIR, `${title}.md`);
      await fs.mkdir(NOTES_DIR, { recursive: true });
      console.log('make dir success');
      await fs.writeFile(filePath, content, 'utf-8');
      return `Successfully wrote to note "${title}".`;
    } catch (error) {
      return `Error writing note: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});
