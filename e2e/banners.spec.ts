import { test, expect } from './fixtures';
import { control, signInOwner, syntheticCaptcha } from './providers';
test('@smoke scheduled banners appear, expire, overlap and update on resume without an inactive gap', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(120000);
  await page.clock.install({ time: new Date('2026-11-13T12:00:00Z') });
  await signInOwner(page, request);
  await page.getByRole('link', { name: 'Banners', exact: true }).click();
  await expect(page.getByText('Schedule timezone: America/New_York')).toBeVisible();
  await page.getByLabel('Message', { exact: true }).fill('First synthetic promotion');
  await page.getByLabel('Starts (America/New_York)').fill('2026-11-13T07:01');
  await page.getByLabel('Ends (America/New_York)').fill('2026-11-13T07:02');
  await page.getByRole('button', { name: 'Save banner' }).click();
  await expect(page.getByRole('status')).toContainText('Banner saved');
  const visitor = await context.newPage();
  await syntheticCaptcha(visitor);
  await visitor.clock.install({ time: new Date('2026-11-13T12:00:00Z') });
  await visitor.goto('/');
  await expect(visitor.getByRole('region', { name: 'Announcement' })).toHaveCount(0);
  await control(request, { now: '2026-11-13T12:01:00Z' });
  await visitor.clock.setSystemTime(new Date('2026-11-13T12:01:00Z'));
  const start = Date.now();
  await visitor.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(visitor.getByRole('region', { name: 'Announcement' })).toHaveText(
    'First synthetic promotion',
    { timeout: 60000 },
  );
  expect(Date.now() - start).toBeLessThan(60000);
  await page.getByLabel('Message', { exact: true }).fill('Newer synthetic promotion');
  await page.getByLabel('Starts (America/New_York)').fill('2026-11-13T07:01');
  await page.getByLabel('Ends (America/New_York)').fill('2026-11-13T07:03');
  await page.getByRole('button', { name: 'Save banner' }).click();
  await expect(page.getByRole('status')).toContainText('Banner saved');
  await visitor.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(visitor.getByRole('region', { name: 'Announcement' })).toHaveText(
    'Newer synthetic promotion',
  );
  await page.getByRole('button', { name: 'Delete Newer synthetic promotion' }).click();
  await page.getByRole('button', { name: 'Confirm deletion' }).click();
  await expect(page.getByRole('status')).toContainText('Banner deleted');
  await visitor.reload();
  await expect(visitor.getByRole('region', { name: 'Announcement' })).toHaveText(
    'First synthetic promotion',
  );
  await page.getByRole('button', { name: 'Edit First synthetic promotion' }).click();
  await page.getByLabel('Message', { exact: true }).fill('Edited synthetic promotion');
  await page.getByRole('button', { name: 'Save banner' }).click();
  await expect(page.getByRole('status')).toContainText('Banner saved');
  for (const path of ['/maternity', '/newborn', '/family', '/about', '/faq', '/contact']) {
    await visitor.goto(path);
    await expect(visitor.getByRole('region', { name: 'Announcement' })).toHaveText(
      'Edited synthetic promotion',
    );
  }
  await visitor.route('http://127.0.0.1:8787/public/bootstrap', (route) => route.abort('failed'));
  await visitor.clock.fastForward(60001);
  await expect(visitor.getByRole('region', { name: 'Announcement' })).toHaveCount(0);
  await visitor.close();
});
