import { PORT } from '@/core/constants/global';
import { serve } from '@hono/node-server';
import { logger } from '@workspace/core/utils/logger';
import { app } from './app';

serve({ ...app, port: PORT }, (info) => {
  logger.info(`Started development server: http://localhost:${info.port}`);
});
