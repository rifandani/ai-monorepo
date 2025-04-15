import { PORT } from '@/core/constants/global';
import { serve } from '@hono/node-server';
import { logger } from '@workspace/core/utils/logger';
import { app } from './app';

serve({ ...app, port: PORT }, (info) => {
  logger.info(`Listening on http://localhost:${info.port}`);
});
