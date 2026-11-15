import { resolve } from 'node:path';

export function recoveryConfig(suffix: string, databaseId: string) {
  if (
    !/^\d{8}-[a-f0-9]{6}$/.test(suffix) ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(databaseId)
  )
    throw new Error('Invalid isolated recovery identity.');
  const name = `radiant-recovery-${suffix}`;
  return {
    name,
    main: resolve('scripts/cloudflare-recovery-rehearsal/worker.ts'),
    compatibility_date: '2026-11-14',
    compatibility_flags: ['nodejs_compat'],
    workers_dev: false,
    preview_urls: false,
    routes: [],
    vars: {
      WEB_ORIGIN: 'https://web.rehearsal.invalid',
      API_ORIGIN: 'https://api.rehearsal.invalid',
    },
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
    triggers: { crons: ['* * * * *'] },
    observability: {
      enabled: true,
      head_sampling_rate: 1,
      logs: { enabled: true, invocation_logs: true },
      traces: { enabled: true, head_sampling_rate: 1 },
    },
  };
}
