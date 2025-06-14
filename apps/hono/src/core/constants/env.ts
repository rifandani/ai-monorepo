import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const ENV = createEnv({
  server: {
    APP_URL: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    GOOGLE_API_KEY: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
});
