import { serve } from '@hono/node-server';
import { logger } from '@workspace/core/utils/logger';
import { PORT } from '@/core/constants/global.js';
import { app } from './app.js';

serve({ ...app, port: PORT }, (info) => {
  logger.log(`Started development server: http://localhost:${info.port}`);
});
