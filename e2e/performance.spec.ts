import { test, expect } from './fixtures';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform, release } from 'node:os';
import { parse } from 'yaml';
import { preparePerformance, mobileProfile, publicUsable } from './performance-helpers';
import { syntheticCaptcha } from './providers';
test.use({ screenshot: 'off', trace: 'off' });
const runner = {
  os: `${platform()} ${release()}`,
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
  memoryGiB: Math.round(totalmem() / 1024 ** 3),
  playwright: '1.65.1',
  fixture: 'synthetic-load-only; approved-photo gate OPEN',
  captcha: 'deterministic adapter; 200 ms readiness; not live Turnstile',
  fixtureClock: 'API date fixed to runner time at each reset; native browser clocks',
};
test('all JSON GETs meet nearest-rank p95 with full synthetic content and 200 clients', async ({
  request,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'chromium-desktop',
    'Runner-independent API profile runs once.',
  );
  test.setTimeout(300000);
  const document = parse(
    await readFile('specs/001-radiant-images-website/contracts/openapi.yaml', 'utf-8'),
  ) as { paths: Record<string, Record<string, unknown>> };
  const paths = Object.keys(document.paths).filter(
    (path) =>
      document.paths[path]?.get &&
      !path.startsWith('/auth/google/') &&
      !path.startsWith('/images/'),
  );
  const results: unknown[] = [];
  for (const template of paths) {
    const fixture = await preparePerformance(request);
    const path = template
      .replace('{id}', fixture.clientId)
      .replace('{token}', fixture.questionnaireToken);
    const sample = async () => {
      const start = performance.now();
      const response = await request.get(
        `http://127.0.0.1:8787${path}?_performance=${Date.now()}`,
        { headers: { Authorization: `Bearer ${fixture.ownerToken}`, 'Cache-Control': 'no-cache' } },
      );
      await response.body();
      if (response.status() !== 200)
        throw new Error(`Unexpected read status for ${template}: ${response.status()}`);
      return performance.now() - start;
    };
    for (let n = 0; n < 10; n++) await sample();
    const samples: number[] = [];
    for (let n = 0; n < 20; n++)
      samples.push(...(await Promise.all(Array.from({ length: 5 }, sample))));
    const p95 = [...samples].sort((a, b) => a - b)[94]!;
    results.push({ operation: template, samples, p95 });
    expect.soft(p95, template).toBeLessThan(500);
  }
  await info.attach('api-latency.json', {
    body: Buffer.from(JSON.stringify({ runner, results }, null, 2)),
    contentType: 'application/json',
  });
});
test('five cold mobile runs per public route record visible usable, LCP, CLS and transfer budgets', async ({
  browser,
  request,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'chromium-desktop',
    'Specified CDP mobile profile runs once.',
  );
  test.setTimeout(600000);
  const results: unknown[] = [];
  const reportPath = info.outputPath('mobile-profile.json');
  await writeFile(
    reportPath,
    JSON.stringify({ runner, browser: browser.version(), results }, null, 2),
  );
  await info.attach('mobile-profile.json', { path: reportPath, contentType: 'application/json' });
  for (const route of [
    '/',
    '/maternity',
    '/newborn',
    '/family',
    '/about',
    '/faq',
    '/contact',
    '/q/{token}',
  ]) {
    const samples: number[] = [];
    for (let run = 0; run < 5; run++) {
      const fixture = await preparePerformance(request);
      const context = await browser.newContext({
          viewport: { width: 375, height: 812 },
          deviceScaleFactor: 1,
          baseURL: 'http://127.0.0.1:4173',
          serviceWorkers: 'block',
        }),
        page = await context.newPage();
      const imageResponses = new Map<string, Promise<number>>();
      page.on('response', (response) => {
        if (response.request().resourceType() === 'image')
          imageResponses.set(
            response.url(),
            response
              .body()
              .then((bytes) => bytes.length)
              .catch(() => -1),
          );
      });
      await mobileProfile(page);
      await syntheticCaptcha(page, 200);
      const path = route.replace('{token}', fixture.questionnaireToken);
      const started = performance.now();
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const interactionMs = await publicUsable(page, route);
      const usable = performance.now() - started;
      samples.push(usable);
      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const above = Array.from(document.images)
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.top < innerHeight && rect.bottom > 0;
          })
          .map((image) => image.currentSrc);
        const lab = (window as unknown as { __lab: { lcp: number; cls: number } }).__lab;
        const navigation = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming;
        const inlineJsBytes = new TextEncoder().encode(
          Array.from(document.scripts)
            .filter((script) => !script.src)
            .map((script) => script.textContent ?? '')
            .join('\n'),
        ).byteLength;
        return {
          ...lab,
          inlineJsBytes,
          navigation: {
            requestStart: navigation.requestStart,
            responseStart: navigation.responseStart,
            responseEnd: navigation.responseEnd,
            domContentLoaded: navigation.domContentLoadedEventEnd,
          },
          jsBytes: resources
            .filter((resource) => /\.js(?:\?|$)/.test(resource.name))
            .reduce((sum, resource) => sum + resource.encodedBodySize, inlineJsBytes),
          above,
        };
      });
      const imageBytes = (
        await Promise.all(
          metrics.above.map((url) => {
            const bytes = imageResponses.get(url);
            if (!bytes) throw new Error('Missing visible image transfer');
            return bytes.then((value) => {
              if (value < 0) throw new Error('Visible image transfer failed');
              return value;
            });
          }),
        )
      ).reduce((sum, value) => sum + value, 0);
      const { above: _above, ...retainedMetrics } = metrics;
      results.push({
        route,
        run,
        fixtureAt: fixture.fixtureAt,
        usable,
        interactionMs,
        ...retainedMetrics,
        imageBytes,
      });
      await writeFile(
        reportPath,
        JSON.stringify({ runner, browser: browser.version(), results }, null, 2),
      );
      expect.soft(metrics.jsBytes, `${route} JS`).toBeLessThanOrEqual(250 * 1024);
      expect.soft(imageBytes, `${route} images`).toBeLessThanOrEqual(500 * 1024);
      expect.soft(metrics.lcp, `${route} LCP`).toBeLessThanOrEqual(2500);
      expect.soft(metrics.cls, `${route} CLS`).toBeLessThanOrEqual(0.1);
      await context.close();
    }
    expect
      .soft([...samples].sort((a, b) => a - b)[2]!, `${route} usable median`)
      .toBeLessThanOrEqual(3000);
  }
  await info.attach('mobile-profile.json', {
    body: Buffer.from(JSON.stringify({ runner, browser: browser.version(), results }, null, 2)),
    contentType: 'application/json',
  });
});
test('twenty independent mobile inquiries each reach acceptance within five seconds', async ({
  browser,
  request,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'chromium-desktop',
    'Specified CDP mobile profile runs once.',
  );
  test.setTimeout(300000);
  const samples: number[] = [];
  for (let run = 0; run < 20; run++) {
    await preparePerformance(request);
    const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 1,
        baseURL: 'http://127.0.0.1:4173',
        serviceWorkers: 'block',
      }),
      page = await context.newPage();
    await mobileProfile(page);
    await syntheticCaptcha(page, 200);
    await page.goto('/contact');
    await page.getByLabel('First name', { exact: true }).fill('Synthetic');
    await page.getByLabel('Last name', { exact: true }).fill(`Inquiry ${run}`);
    await page.getByLabel('Email address', { exact: true }).fill(`perf-${run}@example.invalid`);
    await page.getByLabel('Shoot type', { exact: true }).selectOption('family');
    await page
      .getByLabel('Message', { exact: true })
      .fill(`Synthetic unique performance inquiry ${run}`);
    await page.getByRole('button', { name: 'Complete test verification' }).click();
    const started = performance.now();
    await page.getByRole('button', { name: 'Send inquiry' }).click();
    await expect(page.getByRole('status')).toContainText('accepted for delivery');
    const elapsed = performance.now() - started;
    samples.push(elapsed);
    expect.soft(elapsed, `inquiry ${run + 1}`).toBeLessThan(5000);
    await context.close();
  }
  await info.attach('inquiry-latency.json', {
    body: Buffer.from(JSON.stringify({ runner, browser: browser.version(), samples }, null, 2)),
    contentType: 'application/json',
  });
});
