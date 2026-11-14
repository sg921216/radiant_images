import { fileURLToPath, URL } from 'node:url';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: './apps/api/wrangler.toml' },
      remoteBindings: false,
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations('apps/api/src/db/migrations'),
          OWNER_ALLOWLIST: 'owner@example.invalid',
          GOOGLE_CLIENT_ID: 'test-client',
          GOOGLE_CLIENT_SECRET: 'test-only',
          GMAIL_REFRESH_TOKEN: 'test-only',
          TURNSTILE_SECRET: 'test-only',
          RATE_LIMIT_KEY: 'synthetic-test-key-not-a-production-secret',
          AUTH_KEY: 'synthetic-auth-key-not-a-production-secret',
        },
        outboundService: () => new Response('External requests disabled in tests', { status: 503 }),
      },
    })),
  ],
  test: {
    allowOnly: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    name: 'api',
    include: ['apps/api/tests/**/*.test.ts'],
    setupFiles: ['apps/api/tests/setup.ts'],
    fileParallelism: false,
  },
});
