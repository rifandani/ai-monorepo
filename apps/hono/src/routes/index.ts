import type { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import type { Variables } from '@/core/types/hono.js';
import { deepResearchRoutes } from '@/routes/gemini/agent/deep-research/deep-research.js';
import { geminiRoutes } from '@/routes/gemini.js';
import { imagesRoutes } from '@/routes/images.js';
import { llmsDocsRoutes } from '@/routes/llms-docs.js';
import { mcpRoutes } from '@/routes/mcp.js';
import { mcpClientRoutes } from '@/routes/mcp-client.js';
import { ventureCapitalRoutes } from '@/routes/venture-capital.js';

export async function routes(
  app: OpenAPIHono<{
    Variables: Variables;
  }>
) {
  geminiRoutes(app);
  ventureCapitalRoutes(app);
  deepResearchRoutes(app);
  mcpRoutes(app);
  mcpClientRoutes(app);
  imagesRoutes(app); // run `compose:up` first
  llmsDocsRoutes(app);

  // OpenAPI docs
  app.doc('/openapi', {
    openapi: '3.1.0',
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
  });
  app.get(
    '/openapi/docs',
    Scalar({
      theme: 'elysiajs',
      pageTitle: 'Hono AI',
      sources: [
        {
          title: 'Hono AI',
          url: '/openapi',
        },
        // {
        //   title: 'Scalar Galaxy',
        //   url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        // },
      ],
    })
  );

  // markdown for LLMs. this should be placed after generating openapi docs
  const content = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: { title: 'Example', version: 'v1' },
  });
  const markdown = await createMarkdownFromOpenApi(JSON.stringify(content));

  app.get('/llms.txt', (c) => {
    return c.text(markdown);
  });
}
