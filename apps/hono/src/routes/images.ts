import { db } from '@/core/db';
import { imagesTable, selectImagesTableSchema } from '@/core/db/schema';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';
import {
  type SQL,
  cosineDistance,
  desc,
  getTableColumns,
  gt,
  or,
  sql,
} from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import type { Variables } from 'hono/types';
import { unique } from 'radashi';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

const imageSchema = selectImagesTableSchema.extend({
  similarity: z
    .number()
    .describe(
      'Similarity score from 0 to 1, 0 means no query provided, 1 means direct match using database queries'
    )
    .openapi({
      example: 0.5,
    }),
});
const embedding004 = google.textEmbeddingModel('text-embedding-004');
const { embedding: _, ...rest } = getTableColumns(imagesTable);

type ImageWithoutEmbedding = typeof rest & { embedding: SQL<number[]> };

/**
 * Finds images in the database that have a title or description that contains the query
 * @param query - The query to search for
 * @returns The images that match the query
 */
async function findImageByQuery(
  query: string,
  imagesWithoutEmbedding: ImageWithoutEmbedding
) {
  // select the images that have a title or description that contains the query
  const result = await db
    .select({ image: imagesWithoutEmbedding, similarity: sql<number>`1` })
    .from(imagesTable)
    .where(
      or(
        sql`title ILIKE ${`%${query}%`}`,
        sql`description ILIKE ${`%${query}%`}`
      )
    );

  return result;
}

/**
 * Finds similar image in the database
 * @param description - The description to search for
 * @returns The similar content
 */
async function findSimilarContent(
  description: string,
  imagesWithoutEmbedding: ImageWithoutEmbedding
) {
  // remove newlines from the description
  const value = description.replaceAll('\n', ' ');

  // embed the description
  const { embedding } = await embed({
    model: embedding004,
    value,
  });

  // use cosine distance to find the similarity between the embedding and the imagesTable.embedding
  const similarity = sql<number>`1 - (${cosineDistance(imagesTable.embedding, embedding)})`;

  // select the images that have a similarity greater than 0.35
  const similarImages = await db
    .select({ image: imagesWithoutEmbedding, similarity })
    .from(imagesTable)
    .where(gt(similarity, 0.35)) // experiment with this value based on your embedding model
    .orderBy((t) => desc(t.similarity))
    .limit(10);

  return similarImages;
}

export const imagesApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

imagesApp.get(
  '/',
  describeRoute({
    description: 'Get images',
    responses: {
      200: {
        description: 'Successful get images',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                error: z.string().nullable().describe('Error message'),
                data: z.array(imageSchema),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator(
    'query',
    z.object({
      query: z.string().openapi({
        example: 'cat',
      }),
    })
  ),
  async (c) => {
    const { query } = c.req.valid('query');

    const imagesWithoutEmbedding = {
      ...rest,
      embedding: sql<number[]>`ARRAY[]::integer[]`,
    };

    try {
      // If no query, return all images
      if (query === undefined || query.length < 3) {
        const images = await db
          .select(imagesWithoutEmbedding)
          .from(imagesTable)
          .limit(20);
        const imagesWithSimilarity: z.infer<typeof imageSchema>[] = images.map(
          (image) => ({
            ...image,
            similarity: 0,
          })
        );

        return c.json({ error: null, data: imagesWithSimilarity });
      }

      // find the images that match the query
      const queryMatches = await findImageByQuery(
        query,
        imagesWithoutEmbedding
      );

      // find the images that are similar to the query
      const semanticMatches = await findSimilarContent(
        query,
        imagesWithoutEmbedding
      );

      // combine the images that match the query and the images that are similar to the query
      const imagesWithSimilarity: z.infer<typeof imageSchema>[] = [
        ...queryMatches,
        ...semanticMatches,
      ].map((image) => ({
        ...image.image,
        similarity: image.similarity,
      }));
      // remove duplicates
      const allMatches = unique(imagesWithSimilarity, (image) => image.id);

      return c.json({ error: null, data: allMatches });
    } catch (e) {
      if (e instanceof Error) {
        return c.json({ error: e.message, data: null });
      }

      return c.json({
        error: 'Unexpected error',
        data: null,
      });
    }
  }
);
