import type { MiddlewareHandler } from 'hono';
// import { HTTPException } from 'hono/http-exception'

export function hello(_message = 'Hello!'): MiddlewareHandler {
  return async (_, next) => {
    // c, next
    await next();
    // c.res.headers.append('X-Message', message)

    // if (authorized === false) {
    //   throw new HTTPException(401, { message: 'Custom error message' })
    // }
  };
}
