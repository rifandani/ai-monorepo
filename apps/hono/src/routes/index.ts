import type { Variables } from '@/core/types/hono';
import { geminiApp } from '@/routes/gemini';
import { ollamaApp } from '@/routes/ollama';
import { Scalar } from '@scalar/hono-api-reference';
import type { Hono } from 'hono';
import { openAPISpecs } from 'hono-openapi';

export function routes(
  app: Hono<{
    Variables: Variables;
  }>
) {
  // custom middleware example
  // app.get('/', hello(), ctx => ctx.json({ 1: 'Hello', 2: 'World' }))

  app.route('/ollama', ollamaApp);
  app.route('/gemini', geminiApp);

  app.get(
    '/openapi',
    openAPISpecs(app, {
      documentation: {
        info: {
          title: 'Hono AI',
          version: '1.0.0',
          description: 'API for AI',
        },
        servers: [
          {
            url: 'http://localhost:3333',
            description: 'Local server',
          },
        ],
      },
    })
  );
  app.get(
    '/openapi/docs',
    Scalar({
      theme: 'elysiajs',
      url: '/openapi',
      title: 'Hono AI',
      pageTitle: 'Hono AI',
    })
  );
  // app.get('/ui', swaggerUI({ url: '/doc' }));
}
