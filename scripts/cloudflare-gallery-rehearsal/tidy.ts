import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { token } = JSON.parse(await readFile('.wrangler/gallery-rehearsal/session.json', 'utf8'));
const headers = { Authorization: `Bearer ${token}` };
const base = 'http://127.0.0.1:8796';
const response = await fetch(`${base}/admin/gallery`, { headers });
assert.equal(response.status, 200);
const images = (await response.json()) as { id: string; altText: string }[];
assert(images.every((image) => image.altText.startsWith('Synthetic rehearsal ')));
for (const image of images) {
  const deleted = await fetch(`${base}/admin/gallery/${image.id}`, { method: 'DELETE', headers });
  assert.equal(deleted.status, 204);
}
console.log(`Removed ${images.length} synthetic rehearsal gallery entries.`);
