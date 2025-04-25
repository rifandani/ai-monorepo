import type { MiddlewareHandler } from 'hono';

/**
 * Attempts to prettify a JSON string.
 * @param jsonString The string to prettify.
 * @returns The prettified string if valid JSON, otherwise the original string.
 */
function tryPrettifyJson(jsonString: string): string {
  try {
    const parsedObject = JSON.parse(jsonString);
    return JSON.stringify(parsedObject, null, 2); // 2 spaces indentation
  } catch (_) {
    // Not valid JSON, return original string
    return jsonString;
  }
}

/**
 * a middleware to log the request and response body.
 * useful to know what's being sent and received.
 * Attempts to prettify JSON bodies.
 */
export function reqResLogger(): MiddlewareHandler {
  return async (c, next) => {
    try {
      // Log request body
      const reqClone = c.req.raw.clone(); // Clone the request to read body
      const reqBodyText = await reqClone.text();
      if (reqBodyText) {
        console.log('<-- [Incoming Body]', tryPrettifyJson(reqBodyText));
        console.log('\n');
      }
    } catch (error) {
      console.error('<-- [Error reading request body]', error);
      console.log('\n');
    }

    await next();

    // Log response body after handler execution
    try {
      if (c.res?.body) {
        const resClone = c.res.clone(); // Clone the response
        const resBodyText = await resClone.text();
        if (resBodyText) {
          console.log('--> [Outgoing Body]', tryPrettifyJson(resBodyText));
          console.log('\n');
        }
      }
    } catch (error) {
      console.error('--> [Error reading response body]', error);
      console.log('\n');
    }
  };
}
