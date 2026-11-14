import { expect, test, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ClientsEditor } from '../app/routes/admin/clients';
import { ClientDetailEditor } from '../app/routes/admin/clients.$id';
const id = '01K00000000000000000000001';
const client = {
  id,
  firstName: 'Avery',
  lastName: 'Example',
  email: 'avery@example.invalid',
  phone: null,
  shootType: 'family',
  sessionDate: null,
  notes: 'Manual details',
  createdAt: '2026-11-13T12:00:00.000Z',
  emails: [],
  checklist: [],
  questionnaires: [],
};
afterEach(() => vi.unstubAllGlobals());
test('consecutive client field edits cannot overwrite another field before a render', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json([])),
  );
  render(
    <MemoryRouter>
      <ClientsEditor />
    </MemoryRouter>,
  );
  await screen.findByText('No clients found.');
  act(() => {
    fireEvent.change(screen.getByLabelText('Client first name'), { target: { value: 'Avery' } });
    fireEvent.change(screen.getByLabelText('Client last name'), { target: { value: 'Example' } });
    fireEvent.change(screen.getByLabelText('Client email'), {
      target: { value: 'avery@example.invalid' },
    });
  });
  expect(screen.getByLabelText('Client first name')).toHaveValue('Avery');
  expect(screen.getByLabelText('Client last name')).toHaveValue('Example');
  expect(screen.getByLabelText('Client email')).toHaveValue('avery@example.invalid');
});
test('checklist responds immediately and rolls back a failed update without losing client edits', async () => {
  let finish: (response: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'PUT'
        ? new Promise<Response>((resolve) => {
            finish = resolve;
          })
        : String(input).endsWith('/templates')
          ? Response.json([])
          : Response.json({
              ...client,
              checklist: [{ itemId: id, label: 'Planning', completedAt: null }],
            }),
    ),
  );
  render(
    <MemoryRouter>
      <ClientDetailEditor id={id} />
    </MemoryRouter>,
  );
  const box = await screen.findByLabelText('Planning', { exact: true });
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Client notes'), ' unsaved');
  await user.click(box);
  expect(box).toBeChecked();
  finish(
    Response.json(
      { error: { code: 'internal_error', message: 'Progress update failed.' } },
      { status: 500 },
    ),
  );
  await screen.findByText('Progress update failed.');
  expect(box).not.toBeChecked();
  expect(screen.getByLabelText('Client notes')).toHaveValue('Manual details unsaved');
});
test('client creation preserves manual entry after failure', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'POST'
      ? Response.json(
          { error: { code: 'internal_error', message: 'Save failed.' } },
          { status: 500 },
        )
      : Response.json([]),
  );
  vi.stubGlobal('fetch', fetcher);
  render(
    <MemoryRouter>
      <ClientsEditor />
    </MemoryRouter>,
  );
  await screen.findByText('No clients found.');
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Client first name'), 'Avery');
  await user.type(screen.getByLabelText('Client last name'), 'Example');
  await user.type(screen.getByLabelText('Client email'), 'avery@example.invalid');
  await user.selectOptions(screen.getByLabelText('Session type'), 'family');
  await user.click(screen.getByRole('button', { name: 'Create client' }));
  await screen.findByText('Save failed.');
  expect(screen.getByLabelText('Client first name')).toHaveValue('Avery');
});
test.each([
  ['email_outcome_unknown', 504, 'The email may have been sent.'],
  ['email_history_failed', 500, 'Gmail accepted the email, but history could not be saved.'],
])('client messages suppress blind retry after %s', async (code, status, message) => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'POST'
      ? Response.json({ error: { code, message, retryable: false } }, { status: Number(status) })
      : String(input).endsWith('/templates')
        ? Response.json([])
        : Response.json(client),
  );
  vi.stubGlobal('fetch', fetcher);
  render(
    <MemoryRouter>
      <ClientDetailEditor id={id} />
    </MemoryRouter>,
  );
  await screen.findByLabelText('Email subject');
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email subject'), 'Session details');
  await user.type(screen.getByLabelText('Email message'), 'A synthetic message');
  await user.click(screen.getByRole('button', { name: 'Send email' }));
  await screen.findByText(message);
  expect(screen.getByRole('button', { name: 'Send email' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Send questionnaire invitation' })).toBeDisabled();
  expect(screen.getByLabelText('Email message')).toHaveValue('A synthetic message');
  expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
});
test('owner responses use original snapshot prompts and safe invitation IDs in email history', async () => {
  const snapshot = {
    id,
    prompt: 'Original setting question',
    kind: 'single_choice',
    options: ['Original studio', 'Garden'],
    required: true,
    sortOrder: 0,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith('/templates')
        ? Response.json([])
        : Response.json({
            ...client,
            emails: [
              {
                id,
                templateId: null,
                questionnaireInviteId: id,
                subject: 'Your questions',
                body: '[questionnaire link omitted]',
                sentAt: '2026-11-13T12:00:00.000Z',
              },
            ],
            questionnaires: [
              {
                id,
                sentAt: '2026-11-13T12:00:00.000Z',
                expiresAt: '2026-12-13T12:00:00.000Z',
                submittedAt: '2026-11-14T12:00:00.000Z',
                status: 'submitted',
                questionsSnapshot: [snapshot],
                answers: { [id]: 'Original studio' },
              },
            ],
          }),
    ),
  );
  render(
    <MemoryRouter>
      <ClientDetailEditor id={id} />
    </MemoryRouter>,
  );
  await screen.findByText('Original setting question');
  expect(screen.getByText('Original studio', { exact: true })).toBeVisible();
  expect(screen.getByRole('link', { name: 'View associated questionnaire' })).toHaveAttribute(
    'href',
    `#invitation-${id}`,
  );
  expect(screen.getByText('[questionnaire link omitted]')).toBeVisible();
});
