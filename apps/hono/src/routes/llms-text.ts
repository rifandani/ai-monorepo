import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Variables } from '@/core/types/hono';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/zod';
import { z } from 'zod';
// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

/**
 * Get all files in a directory
 * @param dir - The directory to get the files from
 * @returns An array of file paths
 */
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  // read the directory
  const entries = await readdir(dir, { withFileTypes: true });

  // recursively get all files in the directory
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export const llmsTextApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

llmsTextApp.get(
  '/full',
  describeRoute({
    description: 'Get the combined content of the docs',
    responses: {
      200: {
        description: 'Successful get the combined content of the docs',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                text: z.string().openapi({
                  description: 'The generated text',
                }),
                length: z.number().openapi({
                  description: 'The length of the generated text',
                }),
                tokens: z.number().openapi({
                  description: 'The number of tokens in the generated text',
                }),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    // get the content from the docs folder
    const contentDir = join(process.cwd(), './docs');
    const files = await getAllFiles(contentDir);

    // read all the files and combine them into a single string
    let fullContent = '';
    for (const file of files) {
      const content = await readFile(file, 'utf-8');

      fullContent += content;
      fullContent += '\n\n';
    }

    return c.json({
      text: fullContent,
      length: fullContent.length,
      tokens: fullContent.length / 4,
    });
  }
);
