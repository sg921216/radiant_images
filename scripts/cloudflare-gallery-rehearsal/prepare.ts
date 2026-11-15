import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { rehearsalConfig } from './config';

const [suffix, databaseId, accountId] = process.argv.slice(2);
if (!suffix || !databaseId || !accountId || !/^[a-f0-9]{32}$/.test(accountId))
  throw new Error('Pass the new rehearsal suffix, D1 id and account id.');
const config = rehearsalConfig(suffix, databaseId);
const directory = '.wrangler/gallery-rehearsal';
if (existsSync(`${directory}/manifest.json`))
  throw new Error('A rehearsal already exists; inspect and clean it up first.');
mkdirSync(directory, { recursive: true });
const write = (file: string, value: unknown) =>
  writeFileSync(`${directory}/${file}`, JSON.stringify(value, null, 2) + '\n');
write('manifest.json', {
  suffix,
  databaseId,
  name: config.name,
  createdAt: new Date().toISOString(),
});
write('wrangler.jsonc', { ...config, account_id: accountId });
const token = randomBytes(32).toString('base64url');
write('session.json', { token });
write('secrets.json', {
  OWNER_ALLOWLIST: 'owner@example.invalid',
  AUTH_KEY: randomBytes(32).toString('hex'),
  RATE_LIMIT_KEY: randomBytes(32).toString('hex'),
  GOOGLE_CLIENT_ID: 'synthetic-disabled-rehearsal',
  GOOGLE_CLIENT_SECRET: 'synthetic-disabled-rehearsal',
  GMAIL_REFRESH_TOKEN: 'synthetic-disabled-rehearsal',
  TURNSTILE_SECRET: 'synthetic-disabled-rehearsal',
});
const now = new Date();
const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);
// Only the hash enters the isolated database; the temporary token stays in ignored files.
writeFileSync(
  `${directory}/session.sql`,
  `INSERT INTO sessions(id,token_hash,owner_email,last_seen_at,absolute_expires_at,created_at) VALUES ('01K00000000000000000000099','${createHash('sha256').update(token).digest('hex')}','owner@example.invalid','${now.toISOString()}','${expires.toISOString()}','${now.toISOString()}');\n`,
);
write('proxy.jsonc', {
  account_id: accountId,
  name: `${config.name}-proxy`,
  main: resolve('scripts/cloudflare-gallery-rehearsal/proxy.ts'),
  compatibility_date: '2026-11-14',
  workers_dev: false,
  preview_urls: false,
  services: [{ binding: 'TARGET', service: config.name, remote: true }],
  r2_buckets: config.r2_buckets.map((bucket) => ({ ...bucket, remote: true })),
  observability: { enabled: false },
});
console.log(
  'Private rehearsal config and synthetic session prepared in ignored .wrangler/gallery-rehearsal.',
);
