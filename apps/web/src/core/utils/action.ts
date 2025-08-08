import { logger } from '@workspace/core/utils/logger';
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from 'next-safe-action';
import { z } from 'zod';
import 'server-only';

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Default action client with logging middleware
 */
export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    logger.error(
      '[actionClient]: Error default server error handler',
      error instanceof Error ? error.message : error
    );

    if (error instanceof Error) {
      return error.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  // Here we define a metadata type to be used in `metadata` instance method.
  defineMetadataSchema() {
    return z.object({
      actionName: z.string().describe('The name of the action'),
    });
  },
})
  // Define logging middleware
  .use(async ({ next, metadata }) => {
    const startTime = performance.now();
    const result = await next();
    const endTime = performance.now();

    // Log the action execution time
    logger.log(
      `[actionClient]: ${metadata.actionName} | ${endTime - startTime}ms`
    );

    // Return the result of the awaited action.
    return result;
  });
