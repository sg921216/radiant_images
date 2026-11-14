import { expect, test, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Banner } from '../app/components/Banner';
import { BannerEditor } from '../app/routes/admin/banners';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('a second banner save replaces the old success message until the new save completes', async () => {
  let saves = 0;
  let finish: ((value: Response) => void) | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        saves++;
        return saves === 1
          ? Response.json({})
          : new Promise<Response>((resolve) => {
              finish = resolve;
            });
      }
      return String(input).includes('bootstrap')
        ? Response.json({ config: { timezone: 'America/New_York' } })
        : Response.json([]);
    }),
  );
  render(<BannerEditor />);
  await screen.findByText('Schedule timezone: America/New_York');
  const populate = () => {
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Synthetic promotion' },
    });
    fireEvent.change(screen.getByLabelText('Starts (America/New_York)'), {
      target: { value: '2026-11-13T07:00' },
    });
    fireEvent.change(screen.getByLabelText('Ends (America/New_York)'), {
      target: { value: '2026-11-13T08:00' },
    });
  };
  populate();
  fireEvent.click(screen.getByRole('button', { name: 'Save banner' }));
  await screen.findByText(/Banner saved/);
  populate();
  fireEvent.click(screen.getByRole('button', { name: 'Save banner' }));
  expect(screen.getByRole('status')).toHaveTextContent('Saving banner');
  expect(screen.getByRole('status')).not.toHaveTextContent('Banner saved');
  await act(async () => finish?.(Response.json({})));
  await screen.findByText(/Banner saved/);
});
test('stored banners can load before the timezone without crashing the editor', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('bootstrap')) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return Response.json({ config: { timezone: 'America/New_York' } });
      }
      return Response.json([
        {
          id: '01K00000000000000000000001',
          message: 'Stored promotion',
          linkUrl: null,
          startsAt: '2026-11-13T12:00:00Z',
          endsAt: '2026-11-13T13:00:00Z',
        },
      ]);
    }),
  );
  render(<BannerEditor />);
  expect(await screen.findByRole('button', { name: 'Edit Stored promotion' })).toBeVisible();
  await screen.findByText('Schedule timezone: America/New_York');
});
test('new active data is displayed immediately after a background clock jump', async () => {
  vi.useFakeTimers();
  vi.setSystemTime('2026-11-13T12:00:00Z');
  const view = render(<Banner banner={null} />);
  vi.setSystemTime('2026-11-13T12:10:00Z');
  view.rerender(
    <Banner
      banner={{
        id: '01K00000000000000000000001',
        message: 'A resumed promotion',
        linkUrl: null,
        startsAt: '2026-11-13T12:05:00Z',
        endsAt: '2026-11-13T13:00:00Z',
      }}
    />,
  );
  await act(async () => vi.advanceTimersByTime(1));
  expect(screen.getByText('A resumed promotion')).toBeVisible();
});
test('eligible banner is linked accessibly and disappears locally at its exclusive end during an outage', async () => {
  vi.useFakeTimers();
  vi.setSystemTime('2026-11-13T12:00:00Z');
  const view = render(
    <Banner
      banner={{
        id: '01K00000000000000000000001',
        message: 'A synthetic promotion',
        linkUrl: 'https://example.invalid',
        startsAt: '2026-11-13T12:00:00Z',
        endsAt: '2026-11-13T12:00:01Z',
      }}
    />,
  );
  expect(screen.getByRole('region', { name: 'Announcement' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'A synthetic promotion' })).toHaveAttribute(
    'href',
    'https://example.invalid',
  );
  await act(async () => vi.advanceTimersByTime(1001));
  expect(view.container).toBeEmptyDOMElement();
});
test('banner editor labels timezone, rejects DST ambiguity and preserves a failed save draft', async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'POST'
      ? Response.json(
          { error: { code: 'internal_error', message: 'Save failed.' } },
          { status: 500 },
        )
      : String(input).includes('bootstrap')
        ? Response.json({ config: { timezone: 'America/New_York' } })
        : Response.json([]),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<BannerEditor />);
  await screen.findByText(/Schedule timezone: America\/New_York/);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Message'), 'Holiday sessions');
  await user.type(screen.getByLabelText('Starts (America/New_York)'), '2026-11-01T01:30');
  await user.type(screen.getByLabelText('Ends (America/New_York)'), '2026-11-02T12:00');
  await user.click(screen.getByRole('button', { name: 'Save banner' }));
  await screen.findByText(/ambiguous/);
  expect(fetcher).toHaveBeenCalledTimes(2);
  await user.clear(screen.getByLabelText('Starts (America/New_York)'));
  await user.type(screen.getByLabelText('Starts (America/New_York)'), '2026-11-01T03:30');
  await user.click(screen.getByRole('button', { name: 'Save banner' }));
  await screen.findByText('Save failed.');
  expect(screen.getByLabelText('Message')).toHaveValue('Holiday sessions');
});
