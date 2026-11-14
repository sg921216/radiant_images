import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  test: {
    allowOnly: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    name: 'shared',
    include: ['packages/shared/tests/**/*.test.ts'],
    environment: 'node',
  },
});
