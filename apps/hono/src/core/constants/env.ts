import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const ENV = createEnv({
  server: {
    DATABASE_HOST: z.string().min(1),
    DATABASE_USER: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    DATABASE_PORT: z.number().min(1),
    DATABASE_NAME: z.string().min(1),
  },
  runtimeEnv: process.env,
})
