import { z } from 'zod';

// #region COMMON SCHEMAS
export const errorResponseSchema = z.object({
  message: z.string(),
});

export const resourceListRequestSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe('limit per page. limit=0 to clear'),
  skip: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('skip the first n items.'),
  select: z
    .string()
    .optional()
    .describe('select fields. could be comma separated'),
  delay: z.number().optional().describe('artificial delay in ms.'),
});
export const resourceListResponseSchema = z.object({
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});
// #endregion COMMON SCHEMAS

// #region SCHEMA TYPES
export type ErrorResponseSchema = z.infer<typeof errorResponseSchema>;
export type ResourceListRequestSchema = z.infer<
  typeof resourceListRequestSchema
>;
export type ResourceListResponseSchema = z.infer<
  typeof resourceListResponseSchema
>;
// #endregion SCHEMA TYPES
