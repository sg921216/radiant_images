import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { securityHeaders } from '../../../scripts/security-headers';
const documents: string[] = [];
async function walk(path: string) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) documents.push(await readFile(file, 'utf-8'));
  }
}
await walk('build/client');
if (documents.length < 8) throw new Error('Missing public prerenders or SPA fallback');
const headers = securityHeaders(documents, process.env.VITE_API_ORIGIN || 'http://127.0.0.1:8787');
const template = await readFile('public/_headers', 'utf-8');
await writeFile(
  'build/client/_headers',
  template.replace('__BUILD_CSP__', headers['Content-Security-Policy']!),
);
await writeFile('build/client/security-policy.json', JSON.stringify(headers));
