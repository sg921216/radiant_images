import { expect, test } from 'vitest';
import { createPricingPdf } from '../../apps/web/app/lib/PricingPdf';
test('pricing download is a nonempty valid PDF document for the supplied complete revision', async () => {
  const blob = await createPricingPdf({
    revisionId: '01K00000000000000000000001',
    publishedAt: '2026-11-13T12:00:00.000Z',
    packages: (['maternity', 'newborn', 'family'] as const).map((shootType, index) => ({
      id: `package-${index}`,
      shootType,
      sortOrder: 0,
      name: `${shootType} session`,
      priceCents: 25000,
      description: 'Synthetic package',
      inclusions: ['Planning time'],
    })),
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(1000);
  expect(blob.type).toBe('application/pdf');
});
