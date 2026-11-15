import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { signInOwner } from './providers';
const publicRoutes = ['/', '/maternity', '/newborn', '/family', '/about', '/faq', '/contact'];
test.use({ screenshot: 'off', trace: 'off' });
test('public and owner routes pass automated WCAG checks and keyboard navigation', async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  for (const path of publicRoutes) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if (path === '/contact')
      await expect(page.getByLabel('First name', { exact: true })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
      path,
    ).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  }
  await signInOwner(page, request);
  for (const path of [
    '/admin',
    '/admin/gallery',
    '/admin/content',
    '/admin/pricing',
    '/admin/banners',
    '/admin/settings',
    '/admin/clients',
    '/admin/templates',
    '/admin/checklist',
    '/admin/questionnaire',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
      path,
    ).toEqual([]);
  }
});
test('pending questionnaire and client detail pass automated accessibility with retained data', async ({
  page,
  request,
}) => {
  const profile = await request.post('http://127.0.0.1:8787/__test/performance', {
    headers: { 'X-Synthetic-Test': 'local-only' },
  });
  expect(profile.ok()).toBe(true);
  const data = (await profile.json()) as {
    ownerToken: string;
    questionnaireToken: string;
    clientId: string;
  };
  await page.goto('/');
  await page.evaluate(({ token }) => window.location.assign('/q/' + token), {
    token: data.questionnaireToken,
  });
  await expect(page.getByLabel('Session preference 10', { exact: true })).toBeVisible();
  let result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Submit questionnaire' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.evaluate((token) => sessionStorage.setItem('radiant.owner', token), data.ownerToken);
  await page.goto('/admin/clients/' + data.clientId);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});
