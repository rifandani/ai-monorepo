import { pgTable, text, uuid, vector } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// const timestamps = {
//   createdAt: timestamp().defaultNow().notNull(),
//   updatedAt: timestamp(),
//   // deletedAt: timestamp(),
// };

// #region IMAGES
export const imagesTable = pgTable('images', {
  // id: integer().primaryKey().generatedAlwaysAsIdentity(),
  id: uuid().defaultRandom().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  path: text().notNull(),
  // gemini output dimensions is 768
  embedding: vector({ dimensions: 768 }).notNull(),
});
export const selectImagesTableSchema = createSelectSchema(imagesTable);
export const insertImagesTableSchema = createInsertSchema(imagesTable);
export type ImageTable = z.infer<typeof selectImagesTableSchema>;
// #endregion IMAGES
