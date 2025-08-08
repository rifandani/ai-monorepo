import { createEnv } from '@t3-oss/env-core';
import { z as z3 } from 'zod/v3';

export const ENV = createEnv({
  server: {
    APP_TITLE: z3.string().min(1),
    APP_URL: z3.string().min(1),
    DATABASE_URL: z3.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z3.string().min(1),
    GOOGLE_API_KEY: z3.string().min(1),
    OTEL_LOG_LEVEL: z3.enum([
      'ALL',
      'VERBOSE',
      'DEBUG',
      'INFO',
      'WARN',
      'ERROR',
      'NONE',
    ]),
  },
  runtimeEnv: process.env,
});
