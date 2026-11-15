import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    allowOnly: false,
    projects: [
      'packages/shared/vitest.config.ts',
      'apps/web/vitest.config.ts',
      'apps/api/vitest.config.ts',
      {
        test: {
          name: 'tooling',
          allowOnly: false,
          include: ['scripts/tests/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
