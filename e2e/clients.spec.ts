import { test, expect } from './fixtures';
import type { Page, APIRequestContext } from '@playwright/test';
import { signInOwner, control, sentCount } from './providers';
// Tokenized journeys disable binary artifacts. The first reporter redacts URL-bearing diagnostics.
test.use({ screenshot: 'off', trace: 'off' });
async function createClient(
  page: Page,
  firstName: string,
  entry: 'fill' | 'pressSequentially' = 'fill',
) {
  await page.goto('/admin/clients');
  // Keep these consecutive: waiting between fields could hide the intermittent input loss.
  await page.getByLabel('Client first name')[entry](firstName);
  await page.getByLabel('Client last name')[entry]('Example');
  const email = page.getByLabel('Client email', { exact: true });
  await email[entry](`${firstName.toLowerCase()}@example.invalid`);
  await expect(page.getByLabel('Client first name')).toHaveValue(firstName);
  await expect(page.getByLabel('Client last name')).toHaveValue('Example');
  await expect(page.getByLabel('Client email', { exact: true })).toHaveValue(
    `${firstName.toLowerCase()}@example.invalid`,
  );
  await page.getByRole('button', { name: 'Create client' }).click();
  await expect(
    page.getByRole('heading', { name: `${firstName} Example`, exact: true }),
  ).toBeVisible();
  return new URL(page.url()).pathname;
}
for (const entry of ['fill', 'pressSequentially'] as const)
  test(`@client-entry consecutive ${entry} values survive creation, blur and reload`, async ({
    page,
    request,
  }) => {
    await signInOwner(page, request);
    for (const firstName of ['Avery', 'Blake', 'Casey']) {
      await test.step(`Create and reload ${firstName}`, async () => {
        await createClient(page, firstName, entry);
        // The detail page also has a region named "Client email"; target the form control.
        const email = page.getByRole('textbox', { name: 'Client email', exact: true });
        await expect(email).toHaveValue(`${firstName.toLowerCase()}@example.invalid`);
        await page.reload();
        await expect(page.getByLabel('Client first name')).toHaveValue(firstName);
        await expect(page.getByLabel('Client last name')).toHaveValue('Example');
        await expect(email).toHaveValue(`${firstName.toLowerCase()}@example.invalid`);
      });
    }
  });
async function deliveredPath(request: APIRequestContext) {
  const response = await request.get('http://127.0.0.1:8787/__test/messages', {
    headers: { 'X-Synthetic-Test': 'local-only' },
  });
  const data = (await response.json()) as { messages: string[] };
  const raw = JSON.parse(data.messages.at(-1) ?? '{}').raw as string | undefined;
  if (!raw) throw new Error('Synthetic email was not captured');
  const mime = Buffer.from(raw, 'base64url').toString('utf-8');
  const body = Buffer.from(mime.split('\r\n\r\n')[1]!.replace(/\s/g, ''), 'base64').toString(
    'utf-8',
  );
  const path = body.match(/\/q\/[A-Za-z0-9_-]{43}/)?.[0];
  if (!path) throw new Error('Synthetic email contained no questionnaire link');
  return path;
}
test('@smoke complete owner workflow preserves per-client progress and immutable questionnaire history', async ({
  page,
  request,
  context,
}) => {
  test.setTimeout(180000);
  const started = Date.now();
  await signInOwner(page, request);
  await page.getByRole('link', { name: 'Master checklist', exact: true }).click();
  await page.getByRole('button', { name: 'Add item' }).click();
  await page.getByLabel('Item 1 label').fill('Planning');
  await page.getByRole('button', { name: 'Save checklist' }).click();
  await expect(page.getByRole('status')).toHaveText('Checklist saved.');
  await page.goto('/admin/questionnaire');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question 1 prompt').fill('Original setting question');
  await page.getByLabel('Question 1 type').selectOption('single_choice');
  await page.getByLabel('Question 1 choices (one per line)').fill('Studio\nGarden');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question 2 prompt').fill('Original people question');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question 3 prompt').fill('Original notes question');
  await page.getByLabel('Question 3 type').selectOption('long_text');
  await page.getByRole('button', { name: 'Save questions' }).click();
  await expect(page.getByRole('status')).toHaveText('Questions saved.');
  await page.goto('/admin/templates');
  await page.getByRole('button', { name: 'Add template' }).click();
  await page.getByLabel('Template 1 name').fill('Welcome');
  await page.getByLabel('Template 1 subject').fill('Hello {{firstName}}');
  await page
    .getByLabel('Template 1 body')
    .fill('Your session questionnaire: {{questionnaireLink}}');
  await page.getByRole('button', { name: 'Save templates' }).click();
  await expect(page.getByRole('status')).toHaveText('Templates saved.');
  const avery = await createClient(page, 'Avery');
  await page.getByLabel('Planning', { exact: true }).check();
  await expect(page.getByRole('status')).toContainText('Checklist progress saved');
  const blake = await createClient(page, 'Blake');
  await expect(page.getByLabel('Planning', { exact: true })).not.toBeChecked();
  await page.goto('/admin/checklist');
  await page.getByLabel('Item 1 label').fill('Plan together');
  await page.getByRole('button', { name: 'Add item' }).click();
  await page.getByLabel('Item 2 label').fill('Delivery');
  await page.getByRole('button', { name: 'Move item 2 up' }).click();
  await page.getByRole('button', { name: 'Save checklist' }).click();
  await expect(page.getByRole('status')).toHaveText('Checklist saved.');
  for (const [path, completed] of [
    [avery, true],
    [blake, false],
  ] as const) {
    await page.goto(path);
    await expect(page.getByLabel('Plan together', { exact: true })).toBeChecked({
      checked: completed,
    });
    await expect(page.getByLabel('Delivery', { exact: true })).not.toBeChecked();
  }
  await page.goto('/admin/checklist');
  await page.getByRole('button', { name: 'Add item' }).click();
  await page.getByLabel('Item 3 label').fill('Never published');
  await control(request, { checklistFailure: true });
  await page.getByRole('button', { name: 'Save checklist' }).click();
  await expect(page.getByRole('status')).toContainText('Something went wrong');
  await control(request, { checklistFailure: false });
  await page.reload();
  await expect(page.getByLabel('Item 1 label')).toHaveValue('Delivery');
  await expect(page.getByLabel('Item 2 label')).toHaveValue('Plan together');
  await expect(page.getByLabel('Item 3 label')).toHaveCount(0);
  for (const [path, completed] of [
    [avery, true],
    [blake, false],
  ] as const) {
    await page.goto(path);
    await expect(page.getByLabel('Plan together', { exact: true })).toBeChecked({
      checked: completed,
    });
    await expect(page.getByLabel('Delivery', { exact: true })).not.toBeChecked();
    await expect(page.getByLabel('Never published', { exact: true })).toHaveCount(0);
  }
  await createClient(page, 'Casey');
  await expect(page.getByLabel('Plan together', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Delivery', { exact: true })).not.toBeChecked();
  await page.goto(avery);
  await expect(page.getByLabel('Plan together', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Never published', { exact: true })).toHaveCount(0);
  await page.getByLabel('Email template', { exact: true }).selectOption({ label: 'Welcome' });
  await expect(page.getByLabel('Email subject', { exact: true })).toHaveValue('Hello Avery');
  await expect(page.getByLabel('Email message', { exact: true })).toContainText(
    '{{questionnaireLink}}',
  );
  await page.getByRole('button', { name: 'Send email', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Client email' }).getByRole('status'),
  ).toContainText('Gmail accepted');
  expect(await sentCount(request)).toBe(1);
  const link = await deliveredPath(request),
    visitor = await context.newPage();
  await visitor.goto('/');
  await visitor.evaluate((path) => window.location.assign(path), link);
  await expect(visitor.getByRole('heading', { name: 'Your session questionnaire' })).toBeVisible();
  await visitor.getByLabel('Original setting question', { exact: true }).selectOption('Garden');
  await visitor.getByLabel('Original people question', { exact: true }).fill('Synthetic family');
  await visitor
    .getByLabel('Original notes question', { exact: true })
    .fill('A quiet garden session.');
  await visitor.getByRole('button', { name: 'Submit questionnaire' }).click();
  await expect(visitor.getByRole('status')).toContainText('has been submitted');
  await visitor.reload();
  await expect(visitor.getByRole('status')).toContainText('has been submitted');
  await page.goto('/admin/questionnaire');
  await page.getByLabel('Question 1 prompt').fill('Changed master question');
  await page.getByLabel('Question 1 choices (one per line)').fill('New studio\nBeach');
  await page.getByRole('button', { name: 'Remove question 3' }).click();
  await page.getByRole('button', { name: 'Move question 2 up' }).click();
  await page.getByRole('button', { name: 'Save questions' }).click();
  await expect(page.getByRole('status')).toHaveText('Questions saved.');
  await page.goto(avery);
  const history = page.getByRole('region', { name: 'Questionnaire history' });
  await expect(history.locator('dt')).toHaveText([
    'Original setting question',
    'Original people question',
    'Original notes question',
  ]);
  await expect(history.getByText('Synthetic family', { exact: true })).toBeVisible();
  await expect(history.getByText('A quiet garden session.', { exact: true })).toBeVisible();
  await expect(
    history.getByText('Original choices: Studio, Garden', { exact: true }),
  ).toBeVisible();
  await expect(history.getByText('Original setting question', { exact: true })).toBeVisible();
  await expect(history.getByText('Garden', { exact: true })).toBeVisible();
  await expect(history.getByText('Changed master question', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Email history' })).toContainText(
    '[questionnaire link omitted]',
  );
  await expect(page.getByRole('link', { name: 'View associated questionnaire' })).toHaveAttribute(
    'href',
    /^#invitation-/,
  );
  await page.goto(blake);
  await expect(page.getByRole('region', { name: 'Questionnaire history' })).toContainText(
    'No questionnaire invitations',
  );
  await page.goto(avery);
  await page.getByRole('button', { name: 'Delete client and all history' }).click();
  await page.getByRole('button', { name: 'Confirm client deletion' }).click();
  await expect(page.getByRole('heading', { name: 'Clients', exact: true })).toBeVisible();
  await visitor.reload();
  await expect(
    visitor.getByText('This invitation is not available. Ask Rebekah to check your link.'),
  ).toBeVisible();
  await visitor.close();
  expect(Date.now() - started).toBeLessThan(180000);
});
for (const mode of ['lost', 'history'] as const)
  test(`client ${mode} delivery failure preserves drafts and prevents blind resend`, async ({
    page,
    request,
  }) => {
    await signInOwner(page, request);
    await createClient(page, 'Avery');
    await page.getByLabel('Email subject', { exact: true }).fill('Synthetic session note');
    await page.getByLabel('Email message', { exact: true }).fill('Synthetic message draft');
    await control(request, mode === 'lost' ? { mode: 'lost' } : { historyFailure: true });
    await page.getByRole('button', { name: 'Send email', exact: true }).click();
    await expect(
      page.getByRole('region', { name: 'Client email' }).getByRole('status'),
    ).toContainText(mode === 'lost' ? 'may have been sent' : 'history could not be saved');
    await expect(page.getByRole('button', { name: 'Send email', exact: true })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Send questionnaire invitation' }),
    ).toBeDisabled();
    await expect(page.getByLabel('Email message', { exact: true })).toHaveValue(
      'Synthetic message draft',
    );
    expect(await sentCount(request)).toBe(1);
  });

test('a lost questionnaire response keeps answers and checks recorded status before any second submission', async ({
  page,
  request,
}) => {
  const fixture = await request.post('http://127.0.0.1:8787/__test/performance', {
    headers: { 'X-Synthetic-Test': 'local-only' },
  });
  expect(fixture.ok()).toBe(true);
  const { questionnaireToken } = (await fixture.json()) as { questionnaireToken: string };
  await page.goto('/');
  await page.evaluate((token) => window.location.assign('/q/' + token), questionnaireToken);
  for (let n = 1; n <= 7; n++)
    await page.getByLabel(`Session preference ${n}`, { exact: true }).fill(`Synthetic answer ${n}`);
  for (let n = 8; n <= 10; n++)
    await page.getByLabel(`Session preference ${n}`, { exact: true }).selectOption('Garden');
  let submissions = 0;
  await page.route('http://127.0.0.1:8787/questionnaire/**', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    submissions++;
    await route.fetch();
    await route.abort('failed');
  });
  await page.getByRole('button', { name: 'Submit questionnaire' }).click();
  await expect(page.getByRole('alert')).toContainText('may have been recorded');
  await expect(page.getByLabel('Session preference 1', { exact: true })).toHaveValue(
    'Synthetic answer 1',
  );
  await expect(page.getByRole('button', { name: 'Submit questionnaire' })).toBeDisabled();
  await page.getByRole('button', { name: 'Check submission status' }).click();
  await expect(page.getByRole('status')).toContainText('has been submitted');
  expect(submissions).toBe(1);
});
