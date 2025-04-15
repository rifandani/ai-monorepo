import { PORT } from '@/core/constants/global';
import { app } from './app';

export default {
  ...app,
  port: PORT,
};
