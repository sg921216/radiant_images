import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { isIP } from 'node:net';

const publicSite = process.argv.includes('--public');
const config: { origin: string } = JSON.parse(await readFile('apps/web/branding.json', 'utf-8'));
const origin = publicSite ? config.origin : 'http://127.0.0.1:4193';
const reviewDirectory = `.wrangler/branding-review/${publicSite ? 'public' : 'local'}`;
const resolvedAddress = process.env.BRANDING_VERIFY_ADDRESS;
if (resolvedAddress && (!publicSite || !isIP(resolvedAddress)))
  throw new Error('Use a verified public DNS address only with --public.');
const browser = await chromium.launch({
  args: resolvedAddress
    ? [`--host-resolver-rules=MAP ${new URL(origin).hostname} ${resolvedAddress}`]
    : [],
});
const results: { path: string; width: number; accessibilityViolations: number }[] = [];
try {
  await mkdir(reviewDirectory, { recursive: true });
  for (const width of [320, 768, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    for (const path of ['/', '/privacy']) {
      const response = await page.goto(origin + path);
      assert.equal(response?.status(), 200);
      assert.match(response?.headers()['content-security-policy'] ?? '', /default-src 'none'/);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(
        await page.locator('link[rel="canonical"]').getAttribute('href'),
        new URL(path, config.origin).href,
      );
      assert.ok(await page.locator('a[href="/privacy"]').count());
      assert.equal(await page.locator('script, iframe, form').count(), 0);
      assert.ok(await page.locator('a[href="mailto:radiantimages.ct@gmail.com"]').count());
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.screenshot({
        path: `${reviewDirectory}/${path === '/' ? 'home' : 'privacy'}-${width}.png`,
        fullPage: true,
      });
    }
    await context.close();
    // Axe requires script execution; check the same rendered pages in a separate context.
    const axeContext = await browser.newContext({
      viewport: { width, height: 900 },
      bypassCSP: true,
    });
    const axePage = await axeContext.newPage();
    for (const path of ['/', '/privacy']) {
      await axePage.goto(origin + path);
      const scan = await new AxeBuilder({ page: axePage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      assert.deepEqual(
        scan.violations.map(({ id }) => id),
        [],
      );
      results.push({ path, width, accessibilityViolations: scan.violations.length });
    }
    for (const path of [
      '/admin',
      '/admin/login',
      '/q/missing',
      '/api/public/bootstrap',
      '/missing.js',
    ]) {
      const response = await axePage.goto(origin + path);
      assert.equal(response?.status(), 404, path);
    }
    assert.equal(
      await axePage.evaluate(async () => (await fetch('/privacy', { method: 'HEAD' })).status),
      200,
    );
    assert.equal(
      await axePage.evaluate(async () => (await fetch('/', { method: 'POST' })).status),
      405,
    );
    await axeContext.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  `${reviewDirectory}/results.json`,
  JSON.stringify(
    {
      target: origin,
      resolvedAddress: resolvedAddress ?? null,
      results,
      manualReview: 'deferred',
      deployed: publicSite,
    },
    null,
    2,
  ),
);
console.log(
  'Six page/viewport checks pass: no-JavaScript content, responsive layout and automated accessibility; private/API paths return 404.',
);
