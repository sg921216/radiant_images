import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    allowOnly: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    name: 'web',
    include: ['apps/web/tests/**/*.test.ts?(x)'],
    environment: 'jsdom',
    setupFiles: ['apps/web/tests/setup.ts'],
  },
});
