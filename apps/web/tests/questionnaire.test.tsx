import { expect, test, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionnaireForm } from '../app/routes/public/q.$token';
const id = '01K00000000000000000000001';
const pending = {
  clientFirstName: 'Avery',
  status: 'pending',
  questions: [
    {
      id,
      prompt: 'Choose your setting',
      kind: 'single_choice',
      options: ['Studio', 'Garden'],
      required: true,
      sortOrder: 0,
    },
  ],
};
afterEach(() => vi.unstubAllGlobals());
test('public questionnaire validates required answers and accepts a single submission', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'POST'
      ? Response.json({ status: 'submitted' }, { status: 201 })
      : Response.json(pending),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<QuestionnaireForm token={'a'.repeat(43)} />);
  await screen.findByLabelText('Choose your setting');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Submit questionnaire' }));
  expect(fetcher).toHaveBeenCalledTimes(1);
  await user.selectOptions(screen.getByLabelText('Choose your setting'), 'Garden');
  await user.click(screen.getByRole('button', { name: 'Submit questionnaire' }));
  await screen.findByText('Thank you. Your questionnaire has been submitted.');
  expect(screen.queryByRole('button', { name: 'Submit questionnaire' })).not.toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
test('lost submission response retains answers and checks status without blindly resubmitting', async () => {
  let checks = 0;
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'POST') throw new Error('Synthetic response loss');
    checks++;
    return Response.json(
      checks === 1 ? pending : { ...pending, status: 'submitted', questions: [] },
    );
  });
  vi.stubGlobal('fetch', fetcher);
  render(<QuestionnaireForm token={'a'.repeat(43)} />);
  await screen.findByLabelText('Choose your setting');
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Choose your setting'), 'Garden');
  await user.click(screen.getByRole('button', { name: 'Submit questionnaire' }));
  await screen.findByRole('button', { name: 'Check submission status' });
  expect(screen.getByLabelText('Choose your setting')).toHaveValue('Garden');
  expect(screen.getByRole('button', { name: 'Submit questionnaire' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Check submission status' }));
  await screen.findByText('Thank you. Your questionnaire has been submitted.');
  expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
});
