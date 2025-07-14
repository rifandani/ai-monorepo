import { defineConfig } from 'drizzle-kit';

// config for drizzle-kit
export default defineConfig({
  out: './src/core/db/migrations',
  schema: './src/core/db/schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
