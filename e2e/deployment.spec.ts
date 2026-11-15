import { test, expect } from './fixtures';
test('private deep links serve the generated SPA fallback with noindex and no-referrer', async ({
  page,
}) => {
  for (const path of ['/admin/login', '/admin/callback', '/admin/content', '/q/invalid']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(response?.headers()['referrer-policy']).toBe('no-referrer');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});
test('missing assets are real 404s and public documents contain prerendered headings', async ({
  request,
}) => {
  const asset = await request.get('/assets/missing-image.webp');
  expect(asset.status()).toBe(404);
  const home = await request.get('/');
  expect(await home.text()).toContain('The days are fleeting.');
});
