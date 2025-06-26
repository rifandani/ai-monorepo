import { serve } from '@hono/node-server';
import { logger } from '@workspace/core/utils/logger';
import { PORT } from '@/core/constants/global';
import { app } from './app';

serve({ ...app, port: PORT }, (info) => {
  logger.log(`Started development server: http://localhost:${info.port}`);
});
