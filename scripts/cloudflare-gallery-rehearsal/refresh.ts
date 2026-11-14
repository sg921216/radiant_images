import { readFileSync, writeFileSync } from 'node:fs';
import { rehearsalConfig } from './config';
const directory = '.wrangler/gallery-rehearsal';
const manifest = JSON.parse(readFileSync(`${directory}/manifest.json`, 'utf8'));
const previous = JSON.parse(readFileSync(`${directory}/wrangler.jsonc`, 'utf8'));
const next = rehearsalConfig(manifest.suffix, manifest.databaseId);
if (previous.name !== next.name) throw new Error('Rehearsal identity mismatch.');
writeFileSync(
  `${directory}/wrangler.jsonc`,
  JSON.stringify({ ...next, account_id: previous.account_id }, null, 2) + '\n',
);
