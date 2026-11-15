import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryForm } from '../app/components/forms/InquiryForm';
import { Gallery } from '../app/components/Gallery';
import { routeMetadata } from '../app/lib/metadata';
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
    <button type="button" onClick={() => onSuccess('synthetic-token')}>
      Solve test CAPTCHA
    </button>
  ),
}));
const config = {
  shootLocations: ['Studio'],
  referralSources: ['Business Card'],
  timezone: 'America/New_York',
  publicContactEmail: 'hello@example.invalid',
};
afterEach(() => vi.unstubAllGlobals());
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('First name'), 'Avery');
  await user.type(screen.getByLabelText('Last name'), 'Example');
  await user.type(screen.getByLabelText('Email address'), 'avery@example.invalid');
  await user.selectOptions(screen.getByLabelText('Shoot type'), 'family');
  await user.click(screen.getByRole('button', { name: 'Solve test CAPTCHA' }));
  return user;
}
test('unknown delivery preserves draft and remains blocked until an explicit owner-checked restart with fresh CAPTCHA', async () => {
  const fetcher = vi.fn(async () => {
    throw new Error('lost response');
  });
  vi.stubGlobal('fetch', fetcher);
  render(<InquiryForm config={config} refresh={async () => {}} />);
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
  await screen.findByText(/may have been sent/i);
  expect(screen.getByLabelText('First name')).toHaveValue('Avery');
  expect(screen.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Start a new submission' })).toBeDisabled();
  await user.click(screen.getByLabelText('Rebekah checked and asked me to send again'));
  await user.click(screen.getByRole('button', { name: 'Start a new submission' }));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('First name')).toHaveValue('Avery');
  expect(screen.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Solve test CAPTCHA' }));
  expect(screen.getByRole('button', { name: 'Send inquiry' })).toBeEnabled();
});
test('confirmed receipt finishes without another send; definite rejection retains editable fields', async () => {
  const fetcher = vi.fn(async () =>
    Response.json(
      { error: { code: 'email_not_sent', message: 'Your inquiry was not sent.', retryable: true } },
      { status: 502 },
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<InquiryForm config={config} refresh={async () => {}} />);
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
  await screen.findByText('Your inquiry was not sent.');
  expect(screen.getByLabelText('First name')).toBeEnabled();
  fetcher.mockRejectedValue(new Error('lost'));
  await user.click(screen.getByRole('button', { name: 'Solve test CAPTCHA' }));
  await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
  await user.click(await screen.findByRole('button', { name: 'Rebekah confirmed receipt' }));
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('status')).toHaveTextContent('Receipt confirmed');
});
test('validation focuses error summary, preserves draft, and does not dispatch', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  render(<InquiryForm config={config} refresh={async () => {}} />);
  const user = await fill();
  await user.selectOptions(screen.getByLabelText('Preferred contact method'), 'text');
  await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
  expect(screen.getByRole('alert')).toHaveTextContent('phone');
  expect(fetcher).not.toHaveBeenCalled();
});
test('gallery filters, orders, reserves dimensions and replaces failed images accessibly', () => {
  const images = [
    {
      id: 'one',
      tag: 'family' as const,
      altText: 'Synthetic family at a park',
      sortOrder: 2,
      width: 1200,
      height: 800,
      urls: {
        full: 'https://example.invalid/full',
        card: 'https://example.invalid/card',
        thumb: 'https://example.invalid/thumb',
      },
    },
    {
      id: 'two',
      tag: 'newborn' as const,
      altText: 'Synthetic newborn portrait',
      sortOrder: 1,
      width: 800,
      height: 1000,
      urls: {
        full: 'https://example.invalid/full2',
        card: 'https://example.invalid/card2',
        thumb: 'https://example.invalid/thumb2',
      },
    },
  ];
  render(<Gallery images={images} tag="family" />);
  const picture = screen.getByRole('img', { name: images[0]!.altText });
  expect(picture).toHaveAttribute('width', '1200');
  expect(picture).toHaveAttribute('srcset');
  expect(screen.queryByRole('img', { name: images[1]!.altText })).not.toBeInTheDocument();
  fireEvent.error(picture);
  expect(screen.getByText(/Image unavailable/)).toBeVisible();
});
test('canonical metadata handles Workers trailing-slash redirects', () => {
  expect(routeMetadata('/newborn/')).toEqual(routeMetadata('/newborn'));
});
test('a pending portfolio reserves its loading region without claiming that photographs are loaded', () => {
  render(<Gallery images={[]} loading />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading photographs');
  expect(screen.queryByText(/Photographs will appear/)).not.toBeInTheDocument();
});
