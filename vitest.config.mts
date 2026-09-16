import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Unit tests only: pure modules under lib/. The Playwright smoke lives in
// tests/e2e and is deliberately excluded here (it needs the dev server).
export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
});
