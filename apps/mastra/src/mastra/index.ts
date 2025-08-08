import { Mastra } from '@mastra/core/mastra';
import { PostgresStore } from '@mastra/pg';
import { ENV } from '@/core/constants/env.js';
import { OtelLogger } from '@/core/utils/logger.js';
import { notesMcpServer } from '@/mcp/notes/server.js';
import { weatherAgent } from '@/meteorology/agents/weather.js';
import { weatherWorkflow } from '@/meteorology/workflows/weather.js';
import { stagehandAgent } from '@/web/agents/stagehand.js';

const logger = new OtelLogger({ name: 'mastra', level: 'info' }, true); // disable extra console log

const storage = new PostgresStore({
  connectionString: ENV.DATABASE_URL,
  schemaName: 'mastra',
});

// The inferred type of `mastra` cannot be named without a reference to `xxx`. A type annotation is necessary.
// turning off `declaration` in `tsconfig.json` fixes the issue
export const mastra = new Mastra({
  storage,
  logger, // default is `new ConsoleLogger({ name: 'Mastra', level: 'info' })`
  workflows: { weatherWorkflow },
  agents: { stagehandAgent, weatherAgent },
  mcpServers: { notes: notesMcpServer },
  telemetry: {
    enabled: true,
    serviceName: 'mastra-service',
    sampling: {
      type: 'always_on',
    },
    export: {
      type: 'otlp', // or 'console'
      protocol: 'http', // or 'grpc'
      endpoint: 'http://localhost:4318/v1/traces',
    },
  },
});
