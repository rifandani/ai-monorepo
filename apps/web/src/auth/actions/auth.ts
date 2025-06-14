'use server';

import { AUTH_COOKIE_NAME } from '@/auth/constants/auth';
import { http } from '@/core/services/http';
import type { ActionResult } from '@/core/utils/action';
import { actionClient } from '@/core/utils/action';
import { repositoryErrorMapper } from '@/core/utils/error';
import {
  authRepositories,
  authSignInEmailRequestSchema,
  authSignUpEmailRequestSchema,
} from '@workspace/core/apis/auth';
import { logger } from '@workspace/core/utils/logger';
import { parseSetCookieHeader } from 'better-auth/cookies';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { tryit } from 'radashi';

/**
 * Server action to handle user login.
 *
 * @description
 * 1. Attempts to sign in using email and password
 * 2. On success: Sets an HTTP-only auth cookie and redirects to home
 * 3. On failure: Returns validation or server error messages
 *
 * @returns {Promise<LoginActionResult | void>} Returns error object if login fails (zod error or server error), void if successful (redirects)
 */
export const loginAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(
    authSignInEmailRequestSchema.omit({ callbackURL: true, rememberMe: true })
  )
  .action<ActionResult<null>>(async ({ parsedInput }) => {
    logger.log('[login]: Start login', parsedInput);
    const [error, data] = await tryit(authRepositories(http).signInEmail)({
      json: {
        email: parsedInput.email,
        password: parsedInput.password,
        rememberMe: true,
        callbackURL: '/',
      },
    });
    if (error) {
      return await repositoryErrorMapper(error);
    }

    // INFO: hono backend doesn't set the cookie & we can't use headers from next/headers
    logger.log('[login]: Start set session cookie', data);
    const setCookies = data.headers.get('Set-Cookie');
    const parsed = parseSetCookieHeader(setCookies ?? '');
    const cookie = await cookies();
    for (const [name, value] of parsed) {
      if (!name) {
        continue;
      }

      const opts = {
        sameSite: value.samesite,
        secure: value.secure,
        maxAge: value['max-age'],
        httpOnly: value.httponly,
        domain: value.domain,
        path: value.path,
      } as const;
      try {
        cookie.set(name, decodeURIComponent(value.value), opts);
      } catch (_) {
        // this will fail if the cookie is being set on server component
      }
    }

    // INFO: we can't use redirect in try catch block, because redirect will throw an error object
    logger.log('[login]: Start redirect to /');
    redirect('/');
  });

/**
 * Server action to handle user register.
 *
 * @description
 * 1. Attempts to sign up using email and password
 * 2. On success: Sets an HTTP-only auth cookie and redirects to home
 * 3. On failure: Returns validation or server error messages
 *
 * @returns {Promise<LoginActionResult | void>} Returns error object if register fails (zod error or server error), void if successful (redirects)
 */
export const registerAction = actionClient
  .metadata({ actionName: 'register' })
  .schema(authSignUpEmailRequestSchema)
  .action<ActionResult<null>>(async ({ parsedInput }) => {
    logger.log('[register]: Start register', parsedInput);
    const [error, data] = await tryit(authRepositories(http).signUpEmail)({
      json: parsedInput,
    });
    if (error) {
      return await repositoryErrorMapper(error);
    }

    // INFO: hono backend doesn't set the cookie & we can't use headers from next/headers
    logger.log('[register]: Start set session cookie', data);
    const setCookies = data.headers.get('Set-Cookie');
    const parsed = parseSetCookieHeader(setCookies ?? '');
    const cookie = await cookies();
    for (const [name, value] of parsed) {
      if (!name) {
        continue;
      }

      const opts = {
        sameSite: value.samesite,
        secure: value.secure,
        maxAge: value['max-age'],
        httpOnly: value.httponly,
        domain: value.domain,
        path: value.path,
      } as const;
      try {
        cookie.set(name, decodeURIComponent(value.value), opts);
      } catch (_) {
        // this will fail if the cookie is being set on server component
      }
    }

    // INFO: we can't use redirect in try catch block, because redirect will throw an error object
    logger.log('[register]: Start redirect to /');
    redirect('/');
  });

/**
 * Server action to handle user logout.
 *
 * @note we don't clear session in database. I've tried to use `authClient.signOut` -> 400 error, `authRepositories.signOut` -> 403 error
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
    logger.log('[logout]: Start logging out');
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    logger.log('[logout]: Start redirect to /login');
    redirect('/login');
  });
