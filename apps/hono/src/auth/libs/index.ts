import { ENV } from '@/core/constants/env';
import { db } from '@/core/db';
import * as schema from '@/core/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';

export const auth = betterAuth({
  appName: 'ai-hono',
  baseURL: ENV.APP_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  trustedOrigins: [ENV.APP_URL],
  emailAndPassword: { enabled: true },
  plugins: [openAPI()],
});
