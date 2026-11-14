import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
const { token } = JSON.parse(await readFile('.wrangler/gallery-rehearsal/session.json', 'utf8'));
const headers = { Authorization: `Bearer ${token}` };
const base = 'http://127.0.0.1:8796';
const original = Buffer.from(fixtures.original, 'base64');
const variant = Buffer.from(fixtures.webp, 'base64');
function form() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    tag: 'family',
    altText: 'Synthetic rehearsal concurrency',
    width: '60',
    height: '40',
    originalMime: 'image/png',
    originalBytes: String(original.length),
  }))
    form.set(key, value);
  form.set('original', new Blob([original], { type: 'image/png' }), 'synthetic.png');
  for (const name of ['full', 'card', 'thumb'])
    form.set(name, new Blob([variant], { type: 'image/webp' }), `${name}.webp`);
  return form;
}
const startedAt = new Date().toISOString();
const results = await Promise.all(
  [0, 1].map(async () => {
    const response = await fetch(`${base}/admin/gallery`, {
      method: 'POST',
      headers,
      body: form(),
      signal: AbortSignal.timeout(40_000),
    });
    return {
      status: response.status,
      retryAfter: response.headers.get('Retry-After'),
      body: (await response.json()) as { id?: string; error?: { code: string } },
    };
  }),
);
assert.deepEqual(results.map((r) => r.status).sort(), [201, 429]);
assert.equal(results.find((r) => r.status === 429)?.retryAfter, '2');
assert.equal(results.find((r) => r.status === 429)?.body.error?.code, 'rate_limited');
const images = (await (await fetch(`${base}/admin/gallery`, { headers })).json()) as {
  id: string;
}[];
assert.equal(images.length, 1);
const storage = (await (await fetch(`${base}/__storage`)).json()) as { media: unknown[] };
assert.equal(storage.media.length, 4);
assert.equal(
  (await fetch(`${base}/admin/gallery/${images[0]!.id}`, { method: 'DELETE', headers })).status,
  204,
);
await writeFile(
  'specs/001-radiant-images-website/evidence/cloudflare-gallery-concurrency.json',
  JSON.stringify(
    {
      startedAt,
      completedAt: new Date().toISOString(),
      statuses: results.map((r) => r.status),
      retryAfterSeconds: 2,
      publishedImages: images.length,
      mediaObjects: storage.media.length,
      cleanupPassed: true,
      passed: true,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Concurrent uploads: one published, one retryable 429; no duplicate storage; cleanup passed.',
);
