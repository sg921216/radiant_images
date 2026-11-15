import { test, expect } from './fixtures';
import { signInOwner, syntheticCaptcha } from './providers';
import { sanitizeTestOutput } from '../scripts/sanitize-test-output';
test('@smoke public, private and API responses enforce security headers while the application hydrates', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /Content Security Policy|violates.*directive/.test(message.text())
    )
      errors.push(sanitizeTestOutput(message.text()));
  });
  for (const path of ['/', '/contact', '/admin', '/admin/callback', '/q/invalid']) {
    const response = await request.get(path);
    expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBe('no-referrer');
    if (path.startsWith('/admin') || path.startsWith('/q/'))
      expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  }
  const api = await request.get('http://127.0.0.1:8787/public/bootstrap');
  expect(api.headers()['content-security-policy']).toContain("default-src 'none'");
  await syntheticCaptcha(page);
  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'Tell me your story.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete test verification' })).toBeVisible();
  await signInOwner(page, request);
  await expect(page.getByRole('link', { name: 'Clients', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
