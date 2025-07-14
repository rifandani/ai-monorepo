import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { ENV } from '@/core/constants/env';
import { db } from '@/core/db';
import * as schema from '@/core/db/schema';

export const auth = betterAuth({
  appName: 'ai-hono',
  secret: ENV.BETTER_AUTH_SECRET,
  baseURL: ENV.APP_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.userTable,
      session: schema.sessionTable,
      account: schema.accountTable,
      verification: schema.verificationTable,
      images: schema.imagesTable,
    },
  }),
  trustedOrigins: [ENV.APP_URL, 'http://localhost:3002'],
  emailAndPassword: { enabled: true },
  plugins: [
    openAPI(), // at /api/auth/reference
  ],
});
