import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';
import { IMAGE_VARIANTS, galleryImageSchema } from '../../packages/shared/src';

// Manual, synthetic remote diagnostic. Slow upload traffic keeps the actual coordinator
// active for periodic memory sampling and a concurrent production allocation profile.
const base = 'http://127.0.0.1:8796';
const remoteStreaming = process.argv.includes('--remote-streaming');
const { token } = JSON.parse(await readFile('.wrangler/gallery-rehearsal/session.json', 'utf8'));
const { name } = JSON.parse(await readFile('.wrangler/gallery-rehearsal/manifest.json', 'utf8'));
assert(/^radiant-rehearsal-\d{8}-[a-f0-9]{6}$/.test(name));
const headers = { Authorization: `Bearer ${token}` };
const request = (path: string, init?: RequestInit) =>
  fetch(base + path, { ...init, signal: AbortSignal.timeout(120_000) });
const pixels = Buffer.alloc(8000 * 5000 * 3);
let random = 0x12345678;
for (let i = 0; i < pixels.length; i++) {
  random ^= random << 13;
  random ^= random >>> 17;
  random ^= random << 5;
  pixels[i] = random & 255;
}
const jpeg = await sharp(pixels, { raw: { width: 8000, height: 5000, channels: 3 } })
  .jpeg({ quality: 20 })
  .toBuffer();
let remaining = 10_485_760 - jpeg.length;
assert(remaining > 0);
const padding: Buffer[] = [];
while (remaining) {
  let total = Math.min(65537, remaining);
  if (remaining - total > 0 && remaining - total < 4) total -= 4;
  const segment = Buffer.alloc(total, 65);
  segment[0] = 255;
  segment[1] = 239;
  segment.writeUInt16BE(total - 2, 2);
  padding.push(segment);
  remaining -= total;
}
const original = Buffer.concat([jpeg.subarray(0, 2), ...padding, jpeg.subarray(2)]);
assert.equal(original.length, 10_485_760);
const form = new FormData();
for (const [key, value] of Object.entries({
  tag: 'family',
  altText: 'Synthetic rehearsal sustained memory',
  width: '2000',
  height: '1250',
  originalMime: 'image/jpeg',
  originalBytes: String(original.length),
}))
  form.set(key, value);
form.set('original', new Blob([original], { type: 'image/jpeg' }), 'synthetic.jpg');
for (const variant of ['full', 'card', 'thumb'] as const) {
  const edge = IMAGE_VARIANTS[variant].edge;
  const bytes = await sharp(jpeg)
    .resize({ width: edge, height: edge, fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
  form.set(variant, new Blob([bytes], { type: 'image/webp' }), `${variant}.webp`);
}
const encoded = new Request(base, { method: 'POST', body: form });
const body = new Uint8Array(await encoded.arrayBuffer());
assert(body.byteLength <= 16_777_216);
assert.deepEqual(await (await request('/admin/gallery', { headers })).json(), []);
const startedAt = new Date().toISOString();
const results: Record<string, unknown>[] = [];
try {
  for (let iteration = 0; iteration < 4; iteration++) {
    const start = performance.now();
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (offset >= body.byteLength) return controller.close();
        if (!remoteStreaming) await delay(75);
        controller.enqueue(body.subarray(offset, (offset += 32_768)));
      },
    });
    console.log(`Memory upload ${iteration + 1}/4 started.`);
    const init: RequestInit & { duplex: 'half' } = {
      method: 'POST',
      headers: { ...headers, 'Content-Type': encoded.headers.get('Content-Type')! },
      body: stream,
      duplex: 'half',
    };
    const response = await request('/admin/gallery', init);
    const result: Record<string, unknown> = {
      iteration: iteration + 1,
      status: response.status,
      elapsedMs: Math.round(performance.now() - start),
    };
    results.push(result);
    assert.equal(response.status, 201);
    const image = galleryImageSchema.parse(await response.json());
    const storage = (await (await request('/__storage')).json()) as {
      media: { key: string; size: number }[];
    };
    assert.equal(storage.media.length, 4);
    assert.equal(storage.media.find((o) => o.key.startsWith('originals/'))?.size, original.length);
    assert.equal((await request(`/images/${image.id}/original`)).status, 400);
    for (const variant of ['full', 'card', 'thumb'] as const) {
      const output = await request(new URL(image.urls[variant]).pathname);
      assert.equal(output.status, 200);
      const bytes = Buffer.from(await output.arrayBuffer());
      const decoded = sharp(bytes, { failOn: 'warning' });
      const meta = await decoded.metadata();
      await decoded.raw().toBuffer();
      assert.equal(meta.format, 'webp');
      assert(!meta.exif && !meta.xmp && !meta.icc);
      assert(Math.max(meta.width, meta.height) <= IMAGE_VARIANTS[variant].edge);
      assert(bytes.length <= IMAGE_VARIANTS[variant].bytes);
    }
    assert.equal(
      (await request(`/admin/gallery/${image.id}`, { method: 'DELETE', headers })).status,
      204,
    );
    assert.deepEqual(await (await request('/admin/gallery', { headers })).json(), []);
    result.passed = true;
    console.log(`Memory upload ${iteration + 1}/4 passed and deleted.`);
  }
} finally {
  await writeFile(
    `specs/001-radiant-images-website/evidence/cloudflare-gallery-memory-${remoteStreaming ? 'streaming' : 'workload'}.json`,
    JSON.stringify(
      {
        worker: name,
        startedAt,
        completedAt: new Date().toISOString(),
        sourcePixels: 40_000_000,
        sourceBytes: original.length,
        sourceSha256: createHash('sha256').update(original).digest('hex'),
        multipartBytes: body.length,
        chunkBytes: 32_768,
        chunkDelayMs: 75,
        throttleLocation: remoteStreaming ? 'private Cloudflare driver' : 'local buffered proxy',
        results,
        passed: results.length === 4 && results.every((r) => r.passed),
      },
      null,
      2,
    ) + '\n',
  );
}
