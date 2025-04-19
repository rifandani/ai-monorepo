import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env.prod',
});

export default defineConfig({
  out: './drizzle',
  schema: './src/core/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    url: process.env.DATABASE_URL!,
  },
});
