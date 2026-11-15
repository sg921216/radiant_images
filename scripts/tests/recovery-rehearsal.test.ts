import { expect, test } from 'vitest';
import { recoveryConfig } from '../cloudflare-recovery-rehearsal/config';

test('recovery rehearsal isolates its private resources and accelerated cron from production', () => {
  const config = recoveryConfig('20261114-abc123', '11111111-1111-4111-8111-111111111111');
  expect(config).toMatchObject({
    name: 'radiant-recovery-20261114-abc123',
    main: expect.stringMatching(/cloudflare-recovery-rehearsal[\\/]worker\.ts$/),
    workers_dev: false,
    preview_urls: false,
    routes: [],
    triggers: { crons: ['* * * * *'] },
    r2_buckets: [
      { binding: 'MEDIA', bucket_name: 'radiant-recovery-20261114-abc123-media' },
      { binding: 'RECOVERY', bucket_name: 'radiant-recovery-20261114-abc123-recovery' },
    ],
  });
  expect(() => recoveryConfig('production', '11111111-1111-4111-8111-111111111111')).toThrow();
  expect(() => recoveryConfig('20261114-abc123', '------------------------------------')).toThrow();
});
