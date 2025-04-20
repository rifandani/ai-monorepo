import { auth } from '@/auth/libs';
import type { MiddlewareHandler } from 'hono';

/**
 * a middleware to save the session and user in a context and also add validations for every route.
 */
export function authMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    // get the session from the request
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    // set the user and session in the context
    c.set('user', session ? session.user : null);
    c.set('session', session ? session.session : null);

    return next();
  };
}
