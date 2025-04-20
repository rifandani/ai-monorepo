import { ENV } from '@/core/constants/env';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(ENV.DATABASE_URL, { casing: 'snake_case' });
