'use server';

import { AUTH_COOKIE_NAME } from '@/auth/constants/auth';
import { http } from '@/core/services/http';
import type { ActionResult } from '@/core/utils/action';
import { actionClient } from '@/core/utils/action';
import { repositoryErrorMapper } from '@/core/utils/error';
import {
  authLoginRequestSchema,
  authRepositories,
} from '@workspace/core/apis/auth';
import { logger } from '@workspace/core/utils/logger';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { tryit } from 'radashi';

/**
 * Server action to handle user login.
 *
 * @description
 * 1. Validates the login form data
 * 2. Attempts to authenticate with the server
 * 3. On success: Sets an HTTP-only auth cookie and redirects to home
 * 4. On failure: Returns validation or server error messages
 *
 * @returns {Promise<LoginActionResult | void>} Returns error object if login fails (zod error or server error), void if successful (redirects)
 */
export const loginAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(authLoginRequestSchema)
  .action<ActionResult<null>>(async ({ parsedInput }) => {
    logger.info(parsedInput, '[login]: Start login');
    const [error, response] = await tryit(authRepositories(http).login)({
      json: parsedInput,
    });
    if (error) {
      return await repositoryErrorMapper(error);
    }

    logger.info(response, '[login]: Start set session cookie');
    const cookie = await cookies();
    cookie.set(AUTH_COOKIE_NAME, btoa(JSON.stringify(response)), {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 1, // 1 days
      path: '/',
    });

    // INFO: we can't use redirect in try catch block, because redirect will throw an error object
    logger.info('[login]: Start redirect to /');
    redirect('/');
  });

/**
 * Server action to handle user logout.
 *
 * @description
 * 1. Removes the authentication cookie
 * 2. Redirects user to the login page
 *
 * @returns {Promise<void>} Redirects to login page
 */
export const logoutAction = actionClient
  .metadata({ actionName: 'logoutAction' })
  .action(async () => {
    logger.info('[logout]: Start clearing auth cookie');
    const cookie = await cookies();
    cookie.delete(AUTH_COOKIE_NAME);

    logger.info('[logout]: Start redirect to /login');
    redirect('/login');
  });
