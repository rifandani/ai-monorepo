import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

export const ENV = createEnv({
  server: {
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
});
