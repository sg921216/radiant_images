import { test as base, expect } from '@playwright/test';
import { syntheticCaptcha } from './providers';
// Fresh Playwright contexts; only synthetic fixture identities are used in recorded artifacts.
export const test = base.extend<{ syntheticIdentity: string; isolatedData: void }>({
  isolatedData: [
    async ({ request, page }, use) => {
      await syntheticCaptcha(page);
      const reset = await request.post('http://127.0.0.1:8787/__test/reset', {
        headers: { 'X-Synthetic-Test': 'local-only' },
      });
      expect(reset.ok()).toBe(true);
      await use();
      const cleanup = await request.post('http://127.0.0.1:8787/__test/reset', {
        headers: { 'X-Synthetic-Test': 'local-only' },
      });
      expect(cleanup.ok()).toBe(true);
    },
    { auto: true },
  ],
  syntheticIdentity: async ({ playwright: _playwright }, use, testInfo) => {
    await use(
      `fixture-${testInfo.workerIndex}-${testInfo.testId.replace(/[^a-z0-9]/gi, '')}@example.invalid`,
    );
  },
});
export { expect };
