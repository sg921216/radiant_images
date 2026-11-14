import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { releaseGate } from './release-gate';
releaseGate(readFileSync('specs/001-radiant-images-website/tasks.md', 'utf-8'), process.env);
const kind = process.argv[2];
if (kind !== 'api' && kind !== 'web') throw new Error('Choose api or web');
const required = (name: string) => {
  const value = process.env[name];
  if (!value || /synthetic|replace-|\.invalid/i.test(value))
    throw new Error(`Missing approved configuration: ${name}`);
  return value;
};
const base = {
  name: required(kind === 'api' ? 'API_WORKER_NAME' : 'WEB_WORKER_NAME'),
  compatibility_date: '2026-11-13',
  workers_dev: true,
  observability: { enabled: false },
};
const config =
  kind === 'api'
    ? {
        ...base,
        main: resolve('apps/api/src/index.ts'),
        compatibility_flags: ['nodejs_compat'],
        images: { binding: 'IMAGES' },
        durable_objects: { bindings: [{ name: 'JPEG_VALIDATOR', class_name: 'JpegValidator' }] },
        migrations: [{ tag: 'jpeg-validator-v1', new_sqlite_classes: ['JpegValidator'] }],
        vars: {
          WEB_ORIGIN: required('WEB_ORIGIN'),
          API_ORIGIN: required('API_ORIGIN'),
        },
        d1_databases: [
          {
            binding: 'DB',
            database_name: required('D1_DATABASE_NAME'),
            database_id: required('D1_DATABASE_ID'),
            migrations_dir: resolve('apps/api/src/db/migrations'),
          },
        ],
        r2_buckets: [
          { binding: 'MEDIA', bucket_name: required('MEDIA_BUCKET') },
          { binding: 'RECOVERY', bucket_name: required('RECOVERY_BUCKET') },
        ],
        triggers: { crons: ['*/5 * * * *', '0 3 * * *'] },
      }
    : {
        ...base,
        main: resolve('apps/web/worker.ts'),
        assets: {
          directory: resolve('apps/web/build/client'),
          binding: 'ASSETS',
          run_worker_first: ['/admin', '/admin/*', '/q/*'],
        },
      };
mkdirSync('.wrangler', { recursive: true });
writeFileSync(`.wrangler/release-${kind}.jsonc`, JSON.stringify(config, null, 2));
console.log('Release configuration prepared after task and placeholder checks.');
