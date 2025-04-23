'use server';

import { http } from '@/core/services/http';
import { actionClient } from '@/core/utils/action';
import { z } from 'zod';

type Image = {
  id: string;
  title: string;
  description: string;
  path: string;
  embedding: number[];
  similarity: number;
};

/**
 * Retrieves images from the database
 * @param query - The query to search for
 * @returns The images that match the query
 */
export const getImagesAction = actionClient
  .metadata({ actionName: 'getImages' })
  .schema(z.object({ query: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    try {
      const response = await http.instance.get('images', {
        searchParams: parsedInput.query
          ? { query: parsedInput.query }
          : undefined,
      });
      const json = await response.json<{ data: Image[] }>();

      return { error: null, data: json.data };
    } catch (e) {
      if (e instanceof Error) {
        return { error: e.message, data: null };
      }

      return {
        error: 'Unexpected error',
        data: null,
      };
    }
  });
