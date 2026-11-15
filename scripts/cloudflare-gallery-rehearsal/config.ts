import { resolve } from 'node:path';

export function rehearsalConfig(suffix: string, databaseId: string) {
  if (!/^\d{8}-[a-f0-9]{6}$/.test(suffix) || !/^[a-f0-9-]{36}$/.test(databaseId))
    throw new Error('Invalid isolated rehearsal identity.');
  const name = `radiant-rehearsal-${suffix}`;
  return {
    name,
    main: resolve('apps/api/src/index.ts'),
    compatibility_date: '2026-11-14',
    compatibility_flags: ['nodejs_compat'],
    workers_dev: false,
    preview_urls: false,
    routes: [],
    vars: {
      WEB_ORIGIN: 'https://web.rehearsal.invalid',
      API_ORIGIN: 'https://api.rehearsal.invalid',
    },
    images: { binding: 'IMAGES' },
    durable_objects: {
      bindings: [
        { name: 'JPEG_VALIDATOR', class_name: 'JpegValidator' },
        { name: 'GALLERY_MUTATIONS', class_name: 'GalleryMutations' },
        { name: 'SCHEDULED_OPERATIONS', class_name: 'ScheduledOperations' },
      ],
    },
    migrations: [
      { tag: 'jpeg-validator-v1', new_sqlite_classes: ['JpegValidator'] },
      { tag: 'gallery-mutations-v1', new_sqlite_classes: ['GalleryMutations'] },
      { tag: 'scheduled-operations-v1', new_sqlite_classes: ['ScheduledOperations'] },
    ],
    d1_databases: [
      {
        binding: 'DB',
        database_name: name,
        database_id: databaseId,
        migrations_dir: resolve('apps/api/src/db/migrations'),
      },
    ],
    r2_buckets: [
      { binding: 'MEDIA', bucket_name: `${name}-media` },
      { binding: 'RECOVERY', bucket_name: `${name}-recovery` },
    ],
    observability: {
      enabled: true,
      head_sampling_rate: 1,
      logs: { enabled: true, invocation_logs: true, head_sampling_rate: 1 },
      traces: { enabled: true, head_sampling_rate: 1 },
    },
  };
}
