import { afterEach, expect, test, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PublicLayout } from '../app/components/PublicLayout';
import { PublicContentProvider, usePublicContent } from '../app/lib/publicContent';
import { routeMetadata } from '../app/lib/metadata';
import rows from '../../api/src/db/local-seed.json';
const pricing = rows.find((r) => r.sql.includes('pricing_revisions'))!;
const data = {
  banner: null,
  config: {
    shootLocations: ['Studio'],
    referralSources: ['Business Card'],
    timezone: 'America/New_York',
    publicContactEmail: 'hello@example.invalid',
  },
  gallery: [],
  pages: [],
  faq: [],
  pricing: { revisionId: pricing.values[0], publishedAt: pricing.values[1], packages: [] },
};
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
test('layout provides main landmark, skip navigation and a visible brand link', () => {
  render(
    <MemoryRouter>
      <PublicLayout>
        <h1>Test content</h1>
      </PublicLayout>
    </MemoryRouter>,
  );
  expect(screen.getByRole('main')).toHaveTextContent('Test content');
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('tabindex', '0');
  const brand = screen.getByRole('link', { name: /Radiant Images.*Photography by Rebekah/ });
  expect(brand).toHaveAttribute('href', '/');
  const logo = within(brand).getByRole('img', {
    name: 'Radiant Images Photography by Rebekah Galarza',
  });
  expect(logo).toBeVisible();
  expect(Number(logo.getAttribute('width')) / Number(logo.getAttribute('height'))).toBe(2);
  expect(logo).not.toHaveAttribute('loading', 'lazy');
});
test('public data refreshes by 25 seconds and retains last good content during an outage', async () => {
  function Probe() {
    const state = usePublicContent();
    return (
      <p>
        {state.data?.config.publicContactEmail ?? 'Waiting'}
        {state.error}
      </p>
    );
  }
  const fetcher = vi.fn(async () => Response.json(data, { headers: { Age: '19' } }));
  vi.stubGlobal('fetch', fetcher);
  vi.useFakeTimers();
  render(
    <PublicContentProvider>
      <Probe />
    </PublicContentProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(screen.getByText('hello@example.invalid')).toBeVisible();
  fetcher.mockRejectedValue(new Error('offline'));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(25000);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(screen.getByText(/hello@example.invalid/)).toBeVisible();
});
test('private and tokenized routes are noindex without canonicals and public routes have distinct metadata', async () => {
  expect(routeMetadata('/admin/callback').robots).toBe('noindex, nofollow');
  expect(routeMetadata('/q/secret').canonical).toBeNull();
  expect(routeMetadata('/newborn').title).toContain('Newborn');
  expect(routeMetadata('/newborn').canonical).toMatch(/\/newborn$/);
  await waitFor(() =>
    expect(routeMetadata('/family').title).not.toBe(routeMetadata('/newborn').title),
  );
});
test('initial public hydration consumes the already-started request once before periodic refresh', async () => {
  function Probe() {
    return <p>{usePublicContent().data?.config.publicContactEmail ?? 'Waiting'}</p>;
  }
  vi.stubGlobal('__radiantBootstrap', Promise.resolve(data));
  const fetcher = vi.fn(async () => Response.json(data));
  vi.stubGlobal('fetch', fetcher);
  render(
    <PublicContentProvider>
      <Probe />
    </PublicContentProvider>,
  );
  await screen.findByText('hello@example.invalid');
  expect(fetcher).not.toHaveBeenCalled();
});
