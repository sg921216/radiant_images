import { expect, test, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChecklistEditor } from '../app/routes/admin/checklist';
import { TemplatesEditor } from '../app/routes/admin/templates';
import { QuestionsEditor } from '../app/routes/admin/questionnaire';
afterEach(() => vi.unstubAllGlobals());
test('checklist owner adds, orders and saves items without replacing retained IDs', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'PUT'
      ? Response.json(JSON.parse(String(init.body)))
      : Response.json([{ id: '01K00000000000000000000001', label: 'Plan', sortOrder: 0 }]),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<ChecklistEditor />);
  await screen.findByLabelText('Item 1 label');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Add item' }));
  await user.type(screen.getByLabelText('Item 2 label'), 'Delivery');
  await user.click(screen.getByRole('button', { name: 'Move item 2 up' }));
  await user.click(screen.getByRole('button', { name: 'Save checklist' }));
  await screen.findByText('Checklist saved.');
  const saved = JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body));
  expect(saved.map((item: { label: string }) => item.label)).toEqual(['Delivery', 'Plan']);
  expect(saved[1].id).toBe('01K00000000000000000000001');
});
test('template editor validates placeholders and preserves a failed-save draft', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'PUT'
      ? Response.json(
          { error: { code: 'internal_error', message: 'Save failed.' } },
          { status: 500 },
        )
      : Response.json([]),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<TemplatesEditor />);
  const user = userEvent.setup();
  await screen.findByText('No templates yet.');
  await user.click(screen.getByRole('button', { name: 'Add template' }));
  await user.type(screen.getByLabelText('Template 1 name'), 'Welcome');
  await user.type(screen.getByLabelText('Template 1 subject'), 'Hello');
  await user.type(screen.getByLabelText('Template 1 body'), 'A private session note');
  await user.click(screen.getByRole('button', { name: 'Save templates' }));
  await screen.findByText('Save failed.');
  expect(screen.getByLabelText('Template 1 body')).toHaveValue('A private session note');
});
test('question editor requires valid choices and retains immutable IDs while editing', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'PUT' ? Response.json(JSON.parse(String(init.body))) : Response.json([]),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<QuestionsEditor />);
  const user = userEvent.setup();
  await screen.findByText('No questions yet.');
  await user.click(screen.getByRole('button', { name: 'Add question' }));
  await user.type(screen.getByLabelText('Question 1 prompt'), 'Choose a setting');
  await user.selectOptions(screen.getByLabelText('Question 1 type'), 'single_choice');
  await user.click(screen.getByRole('button', { name: 'Save questions' }));
  expect(fetcher).toHaveBeenCalledTimes(1);
  await user.clear(screen.getByLabelText('Question 1 choices (one per line)'));
  await user.type(screen.getByLabelText('Question 1 choices (one per line)'), 'Studio\nGarden');
  await user.click(screen.getByRole('button', { name: 'Save questions' }));
  await screen.findByText('Questions saved.');
  expect(JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body))[0]).toMatchObject({
    kind: 'single_choice',
    options: ['Studio', 'Garden'],
  });
});
