import { auth } from '@/auth/libs';
import { ENV } from '@/core/constants/env';
import type { Variables } from '@/core/types/hono';
import { routes } from '@/routes';
// import { reqResLogger } from '@/routes/middleware/req-res-logger';
import { otel } from '@hono/otel';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-node';
import { logger } from '@workspace/core/utils/logger';
import { Hono } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { languageDetector } from 'hono/language';
import { logger as loggerMiddleware } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { HTTPError } from 'ky';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// doesn't support cloudflare workers
const memorySpanExporter = new InMemorySpanExporter();
const sdk = new NodeSDK({
  serviceName: 'ai-monorepo-hono',
  traceExporter: memorySpanExporter, // new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

const app = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

app.use(
  '*',
  otel(),
  loggerMiddleware(),
  // reqResLogger(),
  rateLimiter({
    windowMs: 60 * 1_000, // 1 minute
    limit: 600, // Limit each IP to 600 requests per `window` (here, per 1 minute).
    standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: () => crypto.randomUUID(), // Method to generate custom identifiers for clients (should be based on user id, session id, etc). For now, we use random UUID.
    // store: ... , // To support multi-instance apps that runs behind load balancer, use centralized store like Redis (default is MemoryStore)
  }),
  cors({
    origin: [ENV.APP_URL, 'http://localhost:3002'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
  }),
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
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});
// showRoutes(app, {
//   colorize: true,
// });

app.onError(async (error, c) => {
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
  if (error instanceof HTTPError) {
    const errors = await error.response.json();
    return c.json({ message: error.message, error: errors }, 400);
  }
  if (error instanceof HTTPException) {
    // hono built-in http error
    return error.getResponse();
  }

  return c.json({ ...error, message: error.message }, 500);
});

app.notFound((c) => {
  return c.text('404 Not found', 404);
});

export { app };
