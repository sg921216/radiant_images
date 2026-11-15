import { expect, test, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { PricingRevision } from '@radiant/shared';
import { PricingSection } from '../app/components/PricingSection';
import { PricingEditor } from '../app/routes/admin/pricing';
vi.mock('../app/lib/PricingPdf', () => ({
  createPricingPdf: vi.fn(async () => {
    throw new Error('synthetic PDF failure');
  }),
}));
const revision: PricingRevision = {
  revisionId: '01K00000000000000000000001',
  publishedAt: '2026-11-13T12:00:00.000Z',
  packages: (['maternity', 'newborn', 'family'] as const).map((shootType, index) => ({
    id: `01K0000000000000000000001${index}`,
    shootType,
    sortOrder: 0,
    name: `${shootType} package`,
    priceCents: 25000,
    description: 'Synthetic package',
    inclusions: ['Planning time'],
  })),
};
afterEach(() => vi.unstubAllGlobals());
test('service pricing contains its packages and PDF failure leaves pricing and printing available', async () => {
  render(
    <MemoryRouter>
      <PricingSection revision={revision} type="family" />
    </MemoryRouter>,
  );
  const section = screen.getByRole('region', { name: 'Family pricing' });
  expect(within(section).getByText('family package')).toBeVisible();
  expect(within(section).queryByText('newborn package')).not.toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Download all pricing (PDF)' }));
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Print all pricing' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Try PDF again' })).toBeEnabled();
  expect(within(section).getByText('family package')).toBeVisible();
});
test('owner editor requires all shoot types and retains changes after publish failure', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'PUT'
      ? Response.json(
          { error: { code: 'internal_error', message: 'Publication failed.' } },
          { status: 500 },
        )
      : Response.json(revision),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<PricingEditor />);
  const name = await screen.findByLabelText('Maternity package 1 name');
  const user = userEvent.setup();
  await user.clear(name);
  await user.type(name, 'A revised package');
  await user.click(screen.getByRole('button', { name: 'Publish pricing' }));
  await screen.findByText('Publication failed.');
  expect(name).toHaveValue('A revised package');
  await user.click(screen.getByRole('button', { name: 'Remove maternity package 1' }));
  await user.click(screen.getByRole('button', { name: 'Publish pricing' }));
  await screen.findByText(/at least one maternity package/);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
