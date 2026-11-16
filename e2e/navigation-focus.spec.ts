import { test, expect } from './fixtures';

test('public navigation moves focus to new content and preserves initial and hash focus', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  const compact = await menu.isVisible();
  if (compact) await menu.click();
  const link = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', {
    name: 'Maternity',
    exact: true,
  });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Maternity photography', exact: true }),
  ).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
  if (compact) await expect(menu).toHaveAttribute('aria-expanded', 'false');

  await page.goBack();
  await expect(page).toHaveURL(/\/#main$/);
  await expect(page.locator('main')).toBeFocused();
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Maternity photography', exact: true }),
  ).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
});
