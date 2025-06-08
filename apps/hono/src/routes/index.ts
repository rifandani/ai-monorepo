import type { Variables } from '@/core/types/hono';
import { geminiApp } from '@/routes/gemini';
import { agentDeepResearchApp } from '@/routes/gemini/agent/deep-research';
import { imagesApp } from '@/routes/images';
import { llmsTextApp } from '@/routes/llms-text';
import { mcpApp } from '@/routes/mcp';
import { mcpClientApp } from '@/routes/mcp-client';
import { ollamaApp } from '@/routes/ollama';
import { agentVentureCapitalApp } from '@/routes/venture-capital';
import { Scalar } from '@scalar/hono-api-reference';
import type { Hono } from 'hono';
import { openAPISpecs } from 'hono-openapi';

export function routes(
  app: Hono<{
    Variables: Variables;
  }>
) {
  app.route('/ollama', ollamaApp);
  app.route('/gemini', geminiApp);
  app.route('/gemini/agent/venture-capital', agentVentureCapitalApp);
  app.route('/gemini/agent/deep-research', agentDeepResearchApp);
  app.route('/mcp', mcpApp);
  app.route('/mcp-client', mcpClientApp);
  app.route('/images', imagesApp); // run `compose:up` first
  app.route('/llms-text', llmsTextApp);

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
