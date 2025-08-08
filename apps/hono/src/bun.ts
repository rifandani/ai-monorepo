import { PORT } from '@/core/constants/global.js';
import { app } from './app.js';

export default {
  ...app,
  port: PORT,
} as typeof app & {
  port: number;
};
