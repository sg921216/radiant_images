import { expect, test, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentEditor } from '../app/routes/admin/content';
afterEach(() => vi.unstubAllGlobals());
test('page editor loads current copy and retains the draft after a failed save', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'PUT'
      ? Response.json(
          { error: { code: 'internal_error', message: 'Save failed.' } },
          { status: 500 },
        )
      : Response.json({
          pages: [{ page: 'about', introMd: 'Current introduction', howItWorks: [] }],
          faq: [],
        }),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<ContentEditor />);
  const input = await screen.findByLabelText('Introduction');
  const user = userEvent.setup();
  await user.clear(input);
  await user.type(input, 'Edited introduction');
  await user.click(screen.getByRole('button', { name: 'Save page' }));
  await screen.findByText('Save failed.');
  expect(input).toHaveValue('Edited introduction');
  expect(fetcher).toHaveBeenCalledTimes(2);
});
