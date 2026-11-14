import { test, expect } from './fixtures';
import { syntheticCaptcha, control, sentCount } from './providers';
import type { Page } from '@playwright/test';
async function fill(page: Page) {
  await syntheticCaptcha(page);
  await page.goto('/contact');
  await page.getByLabel('First name', { exact: true }).fill('Avery');
  await page.getByLabel('Last name', { exact: true }).fill('Example');
  await page.getByLabel('Email address', { exact: true }).fill('avery@example.invalid');
  await page.getByLabel('Shoot type', { exact: true }).selectOption('family');
  await page.getByLabel('Message', { exact: true }).fill('A synthetic family inquiry.');
  await page.getByRole('button', { name: 'Complete test verification' }).click();
}
test('@smoke public navigation and service discovery', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation.getByRole('link')).toHaveText([
    'Maternity',
    'Newborn',
    'Family',
    'About',
    'Contact',
    'FAQ',
  ]);
  await navigation.getByRole('link', { name: 'Maternity', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'How It Works', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Book Now', exact: true }).first().click();
  await expect(page.getByLabel('First name', { exact: true })).toBeVisible();
});
test('@smoke contact keeps its public recovery address available', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('link', { name: 'hello@example.invalid' })).toHaveAttribute(
    'href',
    'mailto:hello@example.invalid',
  );
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
});
test('@smoke inquiry reaches the real Worker once and reports provider acceptance', async ({
  page,
  request,
}) => {
  await fill(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('accepted for delivery');
  expect(await sentCount(request)).toBe(1);
  await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
});
test('provider response loss preserves the draft, never unlocks on a timer and requires fresh manual submission after owner verification', async ({
  page,
  request,
}) => {
  await control(request, { mode: 'lost' });
  await fill(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('alert')).toContainText('may have been sent');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue(
    'A synthetic family inquiry.',
  );
  await page.clock.install();
  await page.clock.fastForward(180000);
  await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  expect(await sentCount(request)).toBe(1);
  await page.getByLabel('Rebekah checked and asked me to send again').check();
  await page.getByRole('button', { name: 'Start a new submission' }).click();
  await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  await page.getByRole('button', { name: 'Complete test verification' }).click();
  await control(request, { mode: 'accepted', now: '2026-11-13T12:03:00.000Z' });
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('accepted for delivery');
  expect(await sentCount(request)).toBe(2);
});
test('browser response loss stays uncertain and receipt confirmation sends nothing else', async ({
  page,
  request,
}) => {
  await fill(page);
  await page.route('http://127.0.0.1:8787/inquiries', async (route) => {
    await route.fetch();
    await route.abort('failed');
  });
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('alert')).toContainText('may have been sent');
  await page.getByRole('button', { name: 'Rebekah confirmed receipt' }).click();
  await expect(page.getByRole('status')).toContainText('Receipt confirmed');
  expect(await sentCount(request)).toBe(1);
});
test('definite rejection permits an explicit retry and required phone errors focus the summary', async ({
  page,
  request,
}) => {
  await fill(page);
  await page.getByLabel('Preferred contact method', { exact: true }).selectOption('text');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByLabel('Phone number', { exact: true }).fill('5551234567');
  await control(request, { mode: 'rejected' });
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('alert')).toContainText('not sent');
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Avery');
  await control(request, { mode: 'accepted' });
  await page.getByRole('button', { name: 'Complete test verification' }).click();
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('accepted for delivery');
});
test('all contact fields survive an in-flight send and unavailable API keeps the recovery email selectable', async ({
  page,
  request,
}) => {
  await fill(page);
  await page.getByLabel('Phone number', { exact: true }).fill('5551234567');
  await page.getByLabel('Postal code', { exact: true }).fill('10001');
  await page.getByLabel('Preferred day', { exact: true }).fill('2026-12-01');
  await page.getByLabel('Special requests', { exact: true }).fill('Synthetic outdoor preference');
  await page.getByLabel('Session length (hours)', { exact: true }).fill('2');
  await page.getByLabel('Number of people', { exact: true }).fill('4');
  await page.getByLabel('Shoot location', { exact: true }).selectOption('Studio');
  await page
    .getByLabel('How did you hear about us?', { exact: true })
    .selectOption('Word of Mouth');
  await control(request, { providerDelay: 200 });
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('accepted for delivery');
  expect(await sentCount(request)).toBe(1);
  await page.route('http://127.0.0.1:8787/public/bootstrap', (route) => route.abort());
  await page.reload();
  const email = page.getByRole('link', { name: 'hello@example.invalid', exact: true });
  await expect(email).toHaveAttribute('href', 'mailto:hello@example.invalid');
  await expect(email).toHaveText('hello@example.invalid');
  await expect(
    page.getByText('Some content could not be refreshed. Please try again.'),
  ).toBeVisible();
  expect(await sentCount(request)).toBe(1);
});
for (const width of [320, 768, 1280])
  test(`public routes have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/maternity', '/newborn', '/family', '/about', '/faq', '/contact']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  });
