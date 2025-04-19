import path from 'node:path';
import { ENV } from '@/core/constants/env';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';

config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === 'development' ? '.env.local' : '.env.prod'
  ),
});

export const db = drizzle(ENV.DATABASE_URL, { casing: 'snake_case' });
