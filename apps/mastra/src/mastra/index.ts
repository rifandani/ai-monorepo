import { Mastra } from '@mastra/core/mastra';
import { PostgresStore } from '@mastra/pg';
import { ENV } from '@/core/constants/env';
import { OtelLogger } from '@/core/utils/logger';
import { notesMcpServer } from '@/mcp/notes/server';
import { weatherAgent } from '@/meteorology/agents/weather';
import { weatherWorkflow } from '@/meteorology/workflows/weather';
import { stagehandAgent } from '@/web/agents/stagehand';

const logger = new OtelLogger({ name: 'mastra', level: 'info' }, true); // disable extra console log

const storage = new PostgresStore({
  connectionString: ENV.DATABASE_URL,
  schemaName: 'mastra',
});

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
