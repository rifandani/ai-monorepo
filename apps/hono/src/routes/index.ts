import type { Variables } from '@/core/types/hono';
import { deepResearchApp } from '@/routes/deep-research';
import { geminiApp } from '@/routes/gemini';
import { imagesApp } from '@/routes/images';
import { llmsTextApp } from '@/routes/llms-text';
import { mcpApp } from '@/routes/mcp';
import { mcpMarkitdownApp } from '@/routes/mcp-markitdown';
import { ollamaApp } from '@/routes/ollama';
import { ventureCapitalApp } from '@/routes/venture-capital';
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
  app.route('/mcp', mcpApp);
  app.route('/mcp-markitdown', mcpMarkitdownApp);
  app.route('/venture-capital', ventureCapitalApp);
  app.route('/deep-research', deepResearchApp);
  app.route('/images', imagesApp);
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
