'use server';

import { db } from '@/core/db';
import { imagesTable, selectImagesTableSchema } from '@/core/db/schema';
import { actionClient } from '@/core/utils/action';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';
import {
  cosineDistance,
  desc,
  getTableColumns,
  gt,
  or,
  sql,
} from 'drizzle-orm';
import { unique } from 'radashi';
import { z } from 'zod';

const imageSchema = selectImagesTableSchema.extend({
  similarity: z.number(),
});
const outputSchema = z
  .object({
    error: z.string(),
    data: z.null(),
  })
  .or(z.object({ error: z.null(), data: z.array(imageSchema) }));

const embedding004 = google.textEmbeddingModel('text-embedding-004');
const { embedding: _, ...rest } = getTableColumns(imagesTable);
const imagesWithoutEmbedding = {
  ...rest,
  embedding: sql<number[]>`ARRAY[]::integer[]`,
};

/**
 * Finds images in the database that have a title or description that contains the query
 * @param query - The query to search for
 * @returns The images that match the query
 */
async function findImageByQuery(query: string) {
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
async function findSimilarContent(description: string) {
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

/**
 * Retrieves images from the database
 * @param query - The query to search for
 * @returns The images that match the query
 */
export const getImagesAction = actionClient
  .metadata({ actionName: 'getImages' })
  .schema(z.object({ query: z.string().optional() }))
  // .outputSchema(outputSchema)
  .action(async ({ parsedInput }) => {
    try {
      // If no query, return all images
      if (parsedInput.query === undefined || parsedInput.query.length < 3) {
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

        return { error: null, data: imagesWithSimilarity };
      }

      // find the images that match the query
      const queryMatches = await findImageByQuery(parsedInput.query);

      // find the images that are similar to the query
      const semanticMatches = await findSimilarContent(parsedInput.query);

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

      return { error: null, data: allMatches };
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
