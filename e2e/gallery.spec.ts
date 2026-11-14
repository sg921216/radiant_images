import { test, expect } from './fixtures';
import { signInOwner, syntheticCaptcha } from './providers';
import fixtures from './fixtures/images/fixtures.json' with { type: 'json' };
test('@smoke owner uploads oriented images, edits descriptions, reorders and removes public photos', async ({
  page,
  request,
  context,
}) => {
  test.setTimeout(130000);
  const visitor = await context.newPage();
  await syntheticCaptcha(visitor);
  await visitor.goto('/family');
  await signInOwner(page, request);
  await page.goto('/admin/gallery');
  await expect(page.getByText('0 of 60 images')).toBeVisible();
  await page.getByLabel('Photo', { exact: true }).setInputFiles('e2e/fixtures/images/oriented.jpg');
  await page.getByLabel('Photo description (alt text)').fill('A vertical synthetic color study');
  await page.getByLabel('Gallery category').selectOption('family');
  const start = Date.now();
  await page.getByRole('button', { name: 'Upload photo' }).click();
  await expect(page.getByRole('status')).toContainText('Photo published');
  await expect(visitor.getByRole('img', { name: 'A vertical synthetic color study' })).toBeVisible({
    timeout: 60000,
  });
  expect(Date.now() - start).toBeLessThan(60000);
  const image = visitor.getByRole('img', { name: 'A vertical synthetic color study' });
  await expect(image).toHaveAttribute('width', '40');
  await expect(image).toHaveAttribute('height', '60');
  await page
    .getByLabel('Photo', { exact: true })
    .setInputFiles('e2e/fixtures/images/synthetic.png');
  await page.getByLabel('Photo description (alt text)').fill('A horizontal synthetic color study');
  await page.getByRole('button', { name: 'Upload photo' }).click();
  await expect(page.getByText('2 of 60 images')).toBeVisible();
  await page.getByRole('button', { name: 'Move photo 2 up' }).click();
  await expect(page.getByLabel('Description for photo 1')).toHaveValue(
    'A horizontal synthetic color study',
  );
  await page.getByLabel('Description for photo 1').fill('A revised synthetic description');
  await page.getByRole('button', { name: 'Save photo 1' }).click();
  await expect(page.getByRole('status')).toContainText('Photo details saved');
  await page.getByRole('button', { name: 'Remove photo 2' }).click();
  await page.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(page.getByText('1 of 60 images')).toBeVisible();
  await expect(visitor.getByRole('img', { name: 'A vertical synthetic color study' })).toHaveCount(
    0,
    { timeout: 60000 },
  );
  await visitor.close();
});
test('sixty images keep ordering, tag filtering and 320/768/1280 layouts usable', async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  await signInOwner(page, request);
  const token = await page.evaluate(() => sessionStorage.getItem('radiant.owner'));
  const headers = { Authorization: `Bearer ${token}` };
  for (let index = 0; index < 60; index++) {
    const original = Buffer.from(fixtures.original, 'base64'),
      variant = Buffer.from(fixtures.webp, 'base64');
    const response = await request.post('http://127.0.0.1:8787/admin/gallery', {
      headers,
      multipart: {
        tag: index % 2 ? 'newborn' : 'family',
        altText: `Synthetic color study ${index + 1}`,
        width: '60',
        height: '40',
        originalMime: 'image/png',
        originalBytes: String(original.length),
        original: { name: 'synthetic.png', mimeType: 'image/png', buffer: original },
        ...Object.fromEntries(
          ['full', 'card', 'thumb'].map((name) => [
            name,
            { name: `${name}.webp`, mimeType: 'image/webp', buffer: variant },
          ]),
        ),
      },
    });
    expect(response.status()).toBe(201);
  }
  await page.goto('/admin/gallery');
  await expect(page.getByText('60 of 60 images')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload photo' })).toBeDisabled();
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.gallery img')).toHaveCount(60);
    await expect(page.locator('.gallery img').first()).toHaveAttribute(
      'alt',
      'Synthetic color study 1',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/newborn');
  await expect(page.locator('.gallery img')).toHaveCount(30);
  await expect(page.locator('.gallery img').first()).toHaveAttribute(
    'alt',
    'Synthetic color study 2',
  );
  await page.goto('/maternity');
  await expect(page.locator('.gallery img')).toHaveCount(0);
});
