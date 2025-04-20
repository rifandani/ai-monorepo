import { auth } from '@/auth/libs';
import { ENV } from '@/core/constants/env';
import { logger } from '@workspace/core/utils/logger';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { showRoutes } from 'hono/dev';
import { languageDetector } from 'hono/language';
import { logger as loggerMiddleware } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { Variables } from './core/types/hono';
import { routes } from './routes';

const app = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

app.use(
  '*',
  cors({
    origin: [ENV.APP_URL, 'http://localhost:3002'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
  }),
  loggerMiddleware(),
  prettyJSON(),
  requestId(),
  timing(),
  languageDetector({
    supportedLanguages: ['en', 'id'],
    fallbackLanguage: 'en',
  }),
  csrf(
    // {
    //   origin: [`localhost:3000`],
    // },
  ),
  secureHeaders()
);

routes(app);
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));
showRoutes(app, {
  colorize: true,
});

app.onError((error, c) => {
  const requestId = c.get('requestId');
  logger.error(error, `[App]: Error with requestId: ${requestId}`);

  // Log error service, like Sentry, etc
  // captureException({
  //   error,
  //   extra: {
  //     function: '[FILENAME:FUNCTIONAME]',
  //   },
  // })

  if (error instanceof ZodError) {
    const errors = fromZodError(error);
    return c.json(errors, 400);
  }

  return c.json({ ...error, message: error.message }, 500);
});

app.notFound((c) => {
  return c.text('404 Not found', 404);
});

export { app };
