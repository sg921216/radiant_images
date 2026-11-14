import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { control } from './providers';
type Image = {
  id: string;
  tag: string;
  altText: string;
  variants: Record<
    'full' | 'card' | 'thumb',
    { file: string; width: number; height: number; bytes: number; sha256: string }
  >;
};
export async function preparePerformance(request: APIRequestContext) {
  const headers = { 'X-Synthetic-Test': 'local-only' };
  const reset = await request.post('http://127.0.0.1:8787/__test/reset', { headers });
  if (!reset.ok()) throw new Error('Performance reset failed');
  const fixtureAt = new Date().toISOString();
  await control(request, { now: fixtureAt });
  const profile = await request.post('http://127.0.0.1:8787/__test/performance', { headers });
  if (!profile.ok()) throw new Error('Performance content setup failed');
  const credentials = (await profile.json()) as {
    ownerToken: string;
    questionnaireToken: string;
    clientId: string;
  };
  const manifest = JSON.parse(
    await readFile('e2e/fixtures/performance/manifest.json', 'utf-8'),
  ) as { images: Image[]; approvedPhotos: boolean; kind: string };
  if (manifest.images.length !== 60) throw new Error('Performance requires 60 full-size fixtures');
  for (const image of manifest.images) {
    const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = {
      id: image.id,
      metadata: JSON.stringify({
        tag: image.tag,
        altText: image.altText,
        width: image.variants.full.width,
        height: image.variants.full.height,
        originalMime: 'image/webp',
        originalBytes: image.variants.full.bytes,
      }),
    };
    for (const name of ['full', 'card', 'thumb'] as const) {
      const variant = image.variants[name],
        buffer = await readFile(`e2e/fixtures/performance/${variant.file}`);
      if (
        buffer.length !== variant.bytes ||
        createHash('sha256').update(buffer).digest('hex') !== variant.sha256
      )
        throw new Error('Performance fixture integrity failed');
      multipart[name] = { name: variant.file, mimeType: 'image/webp', buffer };
    }
    const result = await request.post('http://127.0.0.1:8787/__test/fixture-image', {
      headers,
      multipart,
    });
    if (!result.ok())
      throw new Error(`Performance gallery setup failed at ${image.id}: ${result.status()}`);
  }
  await control(request, { providerDelay: 200 });
  return {
    ...credentials,
    approvedPhotos: manifest.approvedPhotos,
    kind: manifest.kind,
    fixtureAt,
  };
}
export async function mobileProfile(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1000 * 1000) / 8,
    uploadThroughput: (750 * 1000) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    const lab = {
      lcp: 0,
      cls: 0,
      lcpElement: '',
      shifts: [] as { value: number; nodes: string[] }[],
    };
    Object.assign(window, { __lab: lab });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { element?: Element })[]) {
        lab.lcp = entry.startTime;
        lab.lcpElement = entry.element?.tagName + '.' + (entry.element?.className ?? '');
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
        sources?: { node?: Element }[];
      })[])
        if (!entry.hadRecentInput) {
          lab.cls += entry.value;
          lab.shifts.push({
            value: entry.value,
            nodes: (entry.sources ?? []).map(
              (source) => source.node?.tagName + '.' + (source.node?.className ?? ''),
            ),
          });
        }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}
export async function publicUsable(page: Page, path: string) {
  let interactionMs: number;
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  if (path === '/q/{token}') {
    await expect(page.getByLabel('Session preference 10', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit questionnaire' })).toBeEnabled();
  } else {
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await expect(menu).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Announcement' })).toContainText(
      'Plan a relaxed session',
    );
    if (path === '/contact')
      await expect(page.getByRole('button', { name: 'Complete test verification' })).toBeVisible();
    else if (['/maternity', '/newborn', '/family'].includes(path))
      await expect(
        page.getByRole('button', { name: 'Print all pricing', exact: true }),
      ).toBeEnabled();
    if (path === '/' || ['/maternity', '/newborn', '/family'].includes(path))
      await expect(page.locator('.gallery img')).toHaveCount(path === '/' ? 60 : 20);
    if (path === '/faq') await expect(page.locator('.faq-list summary')).toHaveCount(4);
    if (['/about', '/maternity', '/newborn', '/family'].includes(path))
      await expect(page.locator('.service-intro .prose')).toContainText(
        'A relaxed photography experience',
      );
  }
  await page.evaluate(async () => {
    const images = Array.from(document.images).filter((image) => {
      const box = image.getBoundingClientRect();
      return box.top < innerHeight && box.bottom > 0;
    });
    await Promise.all(images.map((image) => image.decode()));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  // Input ends LCP observation. Verify content/viewport paint before exercising controls.
  const started = performance.now();
  if (path === '/q/{token}') {
    await page.getByLabel('Session preference 1', { exact: true }).fill('Ready');
    interactionMs = performance.now() - started;
  } else {
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    interactionMs = performance.now() - started;
    await menu.click();
  }
  return interactionMs;
}
