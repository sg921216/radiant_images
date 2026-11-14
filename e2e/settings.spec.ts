import { test, expect } from './fixtures';
import { signInOwner, syntheticCaptcha } from './providers';
test('@smoke settings update public recovery details and inquiry delivery independently within 60 seconds', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(70000);
  const visitor = await context.newPage();
  await syntheticCaptcha(visitor);
  await visitor.goto('/contact');
  await expect(visitor.getByRole('link', { name: 'hello@example.invalid' })).toBeVisible();
  await visitor.getByLabel('First name', { exact: true }).fill('Avery');
  await visitor.getByLabel('Last name', { exact: true }).fill('Example');
  await visitor.getByLabel('Email address', { exact: true }).fill('avery@example.invalid');
  await visitor.getByLabel('Shoot type', { exact: true }).selectOption('family');
  await visitor.getByLabel('Shoot location', { exact: true }).selectOption('Outdoors');
  await signInOwner(page, request);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Private inquiry recipient').fill('changed-inquiries@example.invalid');
  await page
    .getByLabel('Public contact email (displayed on the website)')
    .fill('recovery@example.invalid');
  await page.getByLabel('Shoot locations (one per line, in display order)').fill('Garden\nStudio');
  const start = Date.now();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByRole('status')).toContainText('Settings saved');
  await expect(visitor.getByRole('link', { name: 'recovery@example.invalid' })).toBeVisible({
    timeout: 60000,
  });
  expect(Date.now() - start).toBeLessThan(60000);
  await expect(visitor.getByLabel('Shoot location', { exact: true }).locator('option')).toHaveText([
    'Choose an option',
    'Garden',
    'Studio',
    'Outdoors (no longer available)',
  ]);
  await visitor.getByRole('button', { name: 'Complete test verification' }).click();
  await visitor.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(visitor.getByRole('alert')).toContainText('current location');
  await expect(visitor.getByLabel('First name', { exact: true })).toHaveValue('Avery');
  await visitor.getByLabel('Shoot location', { exact: true }).selectOption('Garden');
  await visitor.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(visitor.getByRole('status')).toContainText('accepted for delivery');
  const sent = await request.get('http://127.0.0.1:8787/__test/messages', {
    headers: { 'X-Synthetic-Test': 'local-only' },
  });
  const messages = ((await sent.json()) as { messages: string[] }).messages;
  expect(messages).toHaveLength(1);
  const mime = Buffer.from(JSON.parse(messages[0]!).raw, 'base64url').toString('utf-8');
  expect(mime).toContain('To: changed-inquiries@example.invalid');
  expect(mime).toContain('From: owner@example.invalid');
  expect(mime).not.toContain('recovery@example.invalid');
  await expect(visitor.locator('body')).not.toContainText('changed-inquiries@example.invalid');
  await page.getByLabel('Gmail sender address').fill('unverified@example.invalid');
  await page
    .getByLabel('Public contact email (displayed on the website)')
    .fill('never-published@example.invalid');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByRole('status')).toContainText('accepted send-as alias');
  await page.reload();
  await expect(page.getByLabel('Public contact email (displayed on the website)')).toHaveValue(
    'recovery@example.invalid',
  );
  await visitor.close();
});
