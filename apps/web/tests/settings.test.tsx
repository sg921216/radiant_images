import { expect, test, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsEditor } from '../app/routes/admin/settings';
afterEach(() => vi.unstubAllGlobals());
test('settings label the public recovery address explicitly, reject empty options and preserve failed-save edits', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'PUT'
      ? Response.json(
          {
            error: {
              code: 'sender_verification_unavailable',
              message: 'Verification is unavailable. No settings were changed.',
            },
          },
          { status: 502 },
        )
      : Response.json({
          inquiryRecipient: 'private@example.invalid',
          senderAddress: 'owner@example.invalid',
          publicContactEmail: 'public@example.invalid',
          shootLocations: ['Studio'],
          referralSources: ['Friend'],
          timezone: 'America/New_York',
        }),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<SettingsEditor />);
  const contact = await screen.findByLabelText('Public contact email (displayed on the website)');
  const user = userEvent.setup();
  await user.clear(contact);
  await user.type(contact, 'updated@example.invalid');
  await user.click(screen.getByRole('button', { name: 'Save settings' }));
  await screen.findByText(/Verification is unavailable/);
  expect(contact).toHaveValue('updated@example.invalid');
  await user.clear(screen.getByLabelText('Shoot locations (one per line, in display order)'));
  await user.click(screen.getByRole('button', { name: 'Save settings' }));
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(screen.getByLabelText('Private inquiry recipient')).toHaveValue('private@example.invalid');
});
