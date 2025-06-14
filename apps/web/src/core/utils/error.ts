import type { ActionResult } from '@/core/utils/action';
import type { ErrorResponseSchema } from '@workspace/core/apis/core';
import { logger } from '@workspace/core/utils/logger';
import { HTTPError, TimeoutError } from 'ky';
import { P, match } from 'ts-pattern';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import 'server-only';

/**
 * Map thrown repository error to action result
 *
 * @env server
 *
 * @example
 * ```ts
 * const [errLogin, resLogin] = await tryit(authRepositories(http).login)({ json: parsedInput })
 * if (errLogin) {
 *   return await repositoryErrorMapper(errLogin)
 * }
 * ```
 */
export async function repositoryErrorMapper(
  error: Error
): Promise<ActionResult<null>> {
  return await match(error)
    .with(P.instanceOf(HTTPError), async (err) => {
      logger.error('[repository]: HTTPError', err);
      const json = await err.response.json<ErrorResponseSchema>();
      return { data: null, error: json.message };
    })
    .with(P.instanceOf(ZodError), (err) => {
      logger.error('[repository]: ZodError', err);
      return { data: null, error: fromZodError(err).message };
    })
    .with(P.instanceOf(TimeoutError), (err) => {
      logger.error('[repository]: TimeoutError', err);
      return { data: null, error: err.message };
    })
    .otherwise((err) => {
      logger.error('[repository]: Error', err);
      return { data: null, error: err.message };
    });
}
