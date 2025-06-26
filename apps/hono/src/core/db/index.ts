import { drizzle } from 'drizzle-orm/node-postgres';
import { ENV } from '@/core/constants/env';

export const db = drizzle(ENV.DATABASE_URL, { casing: 'snake_case' });
