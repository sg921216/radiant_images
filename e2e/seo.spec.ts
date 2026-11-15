import { test, expect } from './fixtures';
test('public prerenders expose headings, canonical metadata and sitemap; private routes remain noindex', async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/', '/maternity', '/newborn', '/family', '/about', '/faq', '/contact']) {
    const response = await request.get(path),
      html = await response.text();
    expect(response.status()).toBe(200);
    expect(html).toMatch(/<h1\b/);
    expect(html).toContain('name="description"');
    expect(html).toContain('name="robots" content="index, follow"');
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toBeTruthy();
    expect(new URL(canonical!).pathname).toBe(path);
    expect(sitemap).toContain(`<loc>${canonical}</loc>`);
  }
  for (const path of ['/admin', '/admin/callback', '/q/invalid']) {
    const response = await request.get(path),
      html = await response.text();
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(html).not.toContain('rel="canonical"');
  }
  expect(sitemap).not.toMatch(/\/admin|\/q\//);
});
