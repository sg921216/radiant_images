import { expect, test } from 'vitest';
import { rehearsalConfig } from '../cloudflare-gallery-rehearsal/config';

test('rehearsal deployment is private and cannot target ordinary resource names', () => {
  const config = rehearsalConfig('20261114-abc123', '11111111-1111-4111-8111-111111111111');
  expect(config).toMatchObject({
    name: 'radiant-rehearsal-20261114-abc123',
    workers_dev: false,
    preview_urls: false,
    routes: [],
  });
  expect(config).not.toHaveProperty('triggers');
  expect(() => rehearsalConfig('production', '11111111-1111-4111-8111-111111111111')).toThrow();
});

test('rehearsal binds separate storage and the real production entry point, with telemetry', () => {
  const config = rehearsalConfig('20261114-abc123', '11111111-1111-4111-8111-111111111111');
  expect(config).toMatchObject({
    main: expect.stringMatching(/apps[\\/]api[\\/]src[\\/]index\.ts$/),
    r2_buckets: [
      { binding: 'MEDIA', bucket_name: 'radiant-rehearsal-20261114-abc123-media' },
      { binding: 'RECOVERY', bucket_name: 'radiant-rehearsal-20261114-abc123-recovery' },
    ],
    images: { binding: 'IMAGES' },
    durable_objects: {
      bindings: [
        { name: 'JPEG_VALIDATOR', class_name: 'JpegValidator' },
        { name: 'GALLERY_MUTATIONS', class_name: 'GalleryMutations' },
      ],
    },
    observability: { enabled: true, traces: { enabled: true } },
  });
});
