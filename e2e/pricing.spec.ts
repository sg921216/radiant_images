import { test, expect } from './fixtures';
import { signInOwner, syntheticCaptcha } from './providers';
import { writeFile } from 'node:fs/promises';

test('each service pricing section is one Home link away and its CTA opens Contact', async ({
  page,
}) => {
  for (const type of ['Maternity', 'Newborn', 'Family']) {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /menu/i });
    if (await toggle.isVisible()) await toggle.click();
    await page.getByRole('navigation').getByRole('link', { name: type, exact: true }).click();
    const pricing = page.getByRole('region', { name: `${type} pricing` });
    await expect(pricing.getByText('$250.00')).toBeVisible();
    await pricing.getByRole('link', { name: 'Book Now' }).click();
    await expect(page).toHaveURL(/\/contact$/);
  }
});
test('@smoke service, print and PDF use a complete published pricing revision', async ({
  page,
}, testInfo) => {
  await page.goto('/family');
  const pricing = page.getByRole('region', { name: 'Family pricing' });
  await expect(pricing.getByText('$250.00')).toBeVisible();
  await expect(pricing.getByRole('link', { name: 'Book Now' })).toHaveAttribute('href', '/contact');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download all pricing (PDF)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('radiant-images-pricing-01K00000000000000000000001.pdf');
  const path = await file.path();
  expect(path).not.toBeNull();
  await file.saveAs(testInfo.outputPath('pricing.pdf'));
  await page.emulateMedia({ media: 'print' });
  const schedule = page.locator('.print-schedule');
  await expect(schedule).toBeVisible();
  for (const type of ['Maternity', 'Newborn', 'Family'])
    await expect(
      schedule.getByRole('heading', { name: `${type} pricing`, includeHidden: true }),
    ).toBeVisible();
  await expect(page.getByRole('banner', { includeHidden: true })).not.toBeVisible();
  if (testInfo.project.name === 'chromium-desktop')
    await page.pdf({ path: testInfo.outputPath('pricing-print.pdf'), format: 'A4' });
});
test('a PDF module outage leaves complete web pricing and print controls usable', async ({
  page,
}) => {
  await page.route('**/assets/PricingPdf-*.js', (route) => route.abort('failed'));
  await page.goto('/newborn');
  await page.getByRole('button', { name: 'Download all pricing (PDF)' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be created');
  await expect(page.getByRole('button', { name: 'Print all pricing' })).toBeEnabled();
  await expect(
    page.getByRole('region', { name: 'Newborn pricing' }).getByText('$250.00'),
  ).toBeVisible();
});
test('owner publication reaches an already-open service page within the freshness budget', async ({
  page,
  request,
  context,
}, testInfo) => {
  test.setTimeout(70000);
  const publicPage = await context.newPage();
  await syntheticCaptcha(publicPage);
  await publicPage.goto('/family');
  const pricing = publicPage.getByRole('region', { name: 'Family pricing' });
  await expect(pricing.getByText('$250.00')).toBeVisible();
  await signInOwner(page, request);
  await page.getByRole('link', { name: 'Pricing', exact: true }).click();
  const family = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Family', exact: true }) });
  await family.getByLabel('Price (USD)', { exact: true }).fill('350.50');
  const start = Date.now();
  await page.getByRole('button', { name: 'Publish pricing' }).click();
  await expect(page.getByRole('status')).toContainText('Pricing published');
  await expect(pricing.getByText('$350.50')).toBeVisible({ timeout: 60000 });
  expect(Date.now() - start).toBeLessThan(60000);
  const published = await (await request.get('http://127.0.0.1:8787/pricing')).json();
  const download = publicPage.waitForEvent('download');
  await publicPage.getByRole('button', { name: 'Download all pricing (PDF)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`radiant-images-pricing-${published.revisionId}.pdf`);
  await file.saveAs(testInfo.outputPath('pricing-updated.pdf'));
  await writeFile(testInfo.outputPath('pricing-revision.json'), JSON.stringify(published, null, 2));
  await publicPage.emulateMedia({ media: 'print' });
  const printed = publicPage.locator('.print-schedule');
  await expect(printed.getByText('$350.50')).toBeVisible();
  for (const footer of await printed.locator('.revision').all())
    await expect(footer).toContainText(published.revisionId);
  if (testInfo.project.name === 'chromium-desktop')
    await publicPage.pdf({ path: testInfo.outputPath('pricing-updated-print.pdf'), format: 'A4' });
  await publicPage.close();
});
