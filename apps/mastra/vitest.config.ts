import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@workspace/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
  test: {
    globalSetup: './test/global-setup.ts',
    setupFiles: ['./test/test-setup.ts'],
  },
});
