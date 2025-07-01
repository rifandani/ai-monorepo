import { createEnv } from '@t3-oss/env-core';
import { z as z3 } from 'zod/v3';

export const ENV = createEnv({
  server: {
    GOOGLE_GENERATIVE_AI_API_KEY: z3.string().min(1),
    DATABASE_URL: z3.string().min(1),
  },
  runtimeEnv: process.env,
});
