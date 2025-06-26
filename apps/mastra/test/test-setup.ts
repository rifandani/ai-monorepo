import { attachListeners } from '@mastra/evals';
import { beforeAll } from 'vitest';
import { mastra } from '../src/mastra';

beforeAll(async () => {
  // Store evals in Mastra Storage (requires storage to be enabled)
  await attachListeners(mastra);
});
