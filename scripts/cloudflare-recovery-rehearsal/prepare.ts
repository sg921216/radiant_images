import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { recoveryConfig } from './config';

const [suffix, databaseId, accountId] = process.argv.slice(2);
if (!suffix || !databaseId || !accountId || !/^[a-f0-9]{32}$/.test(accountId))
  throw new Error('Pass the new rehearsal suffix, D1 id and account id.');
const directory = '.wrangler/recovery-rehearsal';
if (existsSync(`${directory}/manifest.json`))
  throw new Error('Inspect the existing rehearsal first.');
const config = { ...recoveryConfig(suffix, databaseId), account_id: accountId };
mkdirSync(directory, { recursive: true });
const write = (file: string, value: unknown) =>
  writeFileSync(`${directory}/${file}`, JSON.stringify(value, null, 2) + '\n');
write('manifest.json', {
  name: config.name,
  suffix,
  databaseId,
  accountId,
  createdAt: new Date().toISOString(),
});
write('wrangler.jsonc', config);
write('proxy.jsonc', {
  name: `${config.name}-proxy`,
  account_id: accountId,
  main: resolve('scripts/cloudflare-recovery-rehearsal/proxy.ts'),
  compatibility_date: config.compatibility_date,
  workers_dev: false,
  preview_urls: false,
  services: [{ binding: 'TARGET', service: config.name, remote: true }],
  r2_buckets: config.r2_buckets.map((bucket) => ({ ...bucket, remote: true })),
  observability: { enabled: false },
});
console.log('Prepared isolated recovery configs in ignored .wrangler/recovery-rehearsal.');
