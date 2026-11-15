import { test, expect } from './fixtures';
test('@smoke local built HTML is served and the API does not fall back to HTML', async ({
  page,
  request,
}) => {
  const navigation = await page.goto('/');
  expect(navigation?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const api = await request.get('http://127.0.0.1:8787/not-an-api-route');
  expect(api.headers()['content-type'] ?? '').not.toContain('text/html');
  expect(api.status()).toBeGreaterThanOrEqual(400);
});
