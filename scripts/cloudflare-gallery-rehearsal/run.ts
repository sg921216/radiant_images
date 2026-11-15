import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
import { IMAGE_VARIANTS, galleryImageSchema, imageHeader } from '../../packages/shared/src';

const base = 'http://127.0.0.1:8796';
const { token } = JSON.parse(await readFile('.wrangler/gallery-rehearsal/session.json', 'utf8'));
const { name } = JSON.parse(await readFile('.wrangler/gallery-rehearsal/manifest.json', 'utf8'));
const headers = { Authorization: `Bearer ${token}` };
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const request = (path: string, init?: RequestInit) =>
  fetch(base + path, { ...init, signal: AbortSignal.timeout(60_000) });
type Inventory = {
  media: { key: string; size: number }[];
  recovery: { key: string; size: number }[];
};
const inventory = async () => (await (await request('/__storage')).json()) as Inventory;
const report: Record<string, unknown>[] = [];
const startedAt = new Date().toISOString();
async function check(label: string, action: (result: Record<string, unknown>) => Promise<void>) {
  const result: Record<string, unknown> = { label, startedAt: new Date().toISOString() };
  const start = performance.now();
  try {
    await action(result);
    result.passed = true;
  } catch (error) {
    result.passed = false;
    result.failure = error instanceof Error ? error.message : 'Unknown failure';
  }
  result.elapsedMs = Math.round(performance.now() - start);
  report.push(result);
  console.log(
    `${label}: ${result.passed ? 'PASS' : 'FAIL'}${result.status ? ` (${result.status})` : ''}`,
  );
}
const png = Buffer.from(fixtures.original, 'base64');
const jpeg = await sharp(png).jpeg().toBuffer();
const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#765432' } });
const cases: { name: string; bytes: Buffer; status: number; mime?: string }[] = [
  { name: 'png', bytes: png, status: 201 },
  { name: 'jpeg', bytes: jpeg, status: 201 },
  { name: 'webp', bytes: Buffer.from(fixtures.webp, 'base64'), status: 201 },
  { name: 'jpeg-exif-orientation', bytes: Buffer.from(fixtures.oriented, 'base64'), status: 201 },
  { name: 'jpeg-truncated', bytes: jpeg.subarray(0, -20), status: 400 },
  {
    name: 'jpeg-truncated-with-eoi',
    bytes: Buffer.concat([jpeg.subarray(0, -20), Buffer.from([255, 217])]),
    status: 400,
  },
  {
    name: 'jpeg-40mp-progressive-444',
    bytes: await solid(8000, 5000)
      .jpeg({ progressive: true, chromaSubsampling: '4:4:4' })
      .toBuffer(),
    status: 201,
  },
  { name: 'jpeg-16384-axis', bytes: await solid(16384, 2000).jpeg().toBuffer(), status: 201 },
];
let remaining = 10_485_760 - jpeg.length;
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
cases.push({
  name: 'jpeg-10mib',
  bytes: Buffer.concat([jpeg.subarray(0, 2), ...padding, jpeg.subarray(2)]),
  status: 201,
});
// Deterministic high-detail pixels exercise entropy work as well as dimensions.
const pixels = Buffer.alloc(8000 * 5000 * 3);
let random = 0x12345678;
for (let i = 0; i < pixels.length; i++) {
  random ^= random << 13;
  random ^= random >>> 17;
  random ^= random << 5;
  pixels[i] = random & 255;
}
const detailed = await sharp(pixels, { raw: { width: 8000, height: 5000, channels: 3 } })
  .jpeg({ quality: 20 })
  .toBuffer();
assert(detailed.length <= 10_485_760);
cases.push({ name: 'jpeg-40mp-detailed', bytes: detailed, status: 201 });
const args = process.argv.slice(2);
const reportName = args.find((arg) => arg.startsWith('--report='))?.slice(9);
if (reportName) assert(/^[a-z0-9-]+$/.test(reportName));
const selection = new Set(args.filter((arg) => !arg.startsWith('--report=')));
for (const entry of selection)
  assert(
    cases.some((c) => c.name === entry),
    `Unknown case: ${entry}`,
  );

await check('unauthorized-upload', async (result) => {
  const response = await request('/admin/gallery', { method: 'POST', body: new FormData() });
  result.status = response.status;
  assert.equal(response.status, 401);
});
for (const entry of cases.filter((c) => !selection.size || selection.has(c.name))) {
  await check(entry.name, async (result) => {
    const before = await inventory();
    const beforeGallery = (await (
      await request('/admin/gallery', { headers })
    ).json()) as unknown[];
    const info = imageHeader(entry.bytes);
    const form = new FormData();
    form.set('tag', 'family');
    form.set('altText', `Synthetic rehearsal ${entry.name}`);
    form.set('originalMime', info.mime);
    form.set('originalBytes', String(entry.bytes.length));
    form.set(
      'original',
      new Blob([new Uint8Array(entry.bytes)], { type: info.mime }),
      'synthetic-photo',
    );
    for (const variant of ['full', 'card', 'thumb'] as const) {
      const edge = IMAGE_VARIANTS[variant].edge;
      const output = await sharp(entry.status === 201 ? entry.bytes : png)
        .rotate()
        .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      form.set(variant, new Blob([output.data], { type: 'image/webp' }), `${variant}.webp`);
      if (variant === 'full') {
        form.set('width', String(output.info.width));
        form.set('height', String(output.info.height));
      }
    }
    result.inputBytes = entry.bytes.length;
    result.inputSha256 = hash(entry.bytes);
    result.expectedStatus = entry.status;
    const uploadStart = performance.now();
    const response = await request('/admin/gallery', { method: 'POST', headers, body: form });
    result.status = response.status;
    result.requestId = response.headers.get('X-Request-Id');
    result.uploadMs = Math.round(performance.now() - uploadStart);
    const text = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { nonJsonResponse: true };
    }
    if (response.status !== entry.status) result.response = body;
    assert.equal(response.status, entry.status);
    if (entry.status === 400) {
      assert.match(text, /Re-export/);
      assert.deepEqual(await inventory(), before);
      assert.deepEqual(await (await request('/admin/gallery', { headers })).json(), beforeGallery);
      result.noWrites = true;
      return;
    }
    const image = galleryImageSchema.parse(body);
    const after = await inventory();
    assert.equal(after.media.length, before.media.length + 4);
    assert.equal(
      after.media.find((o) => o.key === `originals/${image.id}/source`)?.size,
      entry.bytes.length,
    );
    const gallery = (await (await request('/admin/gallery', { headers })).json()) as {
      id: string;
    }[];
    assert(gallery.some((row) => row.id === image.id));
    const outputs: Record<string, unknown> = {};
    for (const variant of ['full', 'card', 'thumb'] as const) {
      const response = await request(new URL(image.urls[variant]).pathname);
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      const header = imageHeader(bytes);
      assert.equal(header.mime, 'image/webp');
      assert.equal(header.hasMetadata, false);
      assert.equal(header.animated, false);
      assert(bytes.length <= IMAGE_VARIANTS[variant].bytes);
      assert(Math.max(header.width, header.height) <= IMAGE_VARIANTS[variant].edge);
      if (variant === 'full') {
        assert.equal(header.width, Number(form.get('width')));
        assert.equal(header.height, Number(form.get('height')));
      }
      await sharp(bytes, { failOn: 'warning' }).stats();
      outputs[variant] = {
        bytes: bytes.length,
        width: header.width,
        height: header.height,
        sha256: hash(bytes),
      };
    }
    result.outputs = outputs;
    assert.equal((await request(`/images/${image.id}/original`)).status, 400);
    assert.equal((await request(`/originals/${image.id}/source`)).status, 404);
    result.originalPrivate = true;
    const removed = await request(`/admin/gallery/${image.id}`, { method: 'DELETE', headers });
    assert.equal(removed.status, 204);
    assert.equal((await request(`/images/${image.id}/full`)).status, 404);
    assert.deepEqual((await inventory()).media, before.media);
    result.deleted = true;
  });
}
const finalStorage = await inventory();
const filename = reportName
  ? `cloudflare-gallery-rehearsal-${reportName}.json`
  : selection.size
    ? 'cloudflare-gallery-rehearsal-followup.json'
    : 'cloudflare-gallery-rehearsal.json';
const failures = report.filter((r) => !r.passed).length;
await writeFile(
  `specs/001-radiant-images-website/evidence/${filename}`,
  JSON.stringify(
    {
      startedAt,
      completedAt: new Date().toISOString(),
      worker: name,
      scope:
        'Deployed private production API entry point, D1, R2, Images and SQLite Durable Object; invoked through a local service-binding proxy. Synthetic session/data only.',
      node: process.version,
      sharp: sharp.versions.sharp,
      results: report,
      failures,
      finalStorage: {
        mediaObjects: finalStorage.media.length,
        mediaBytes: finalStorage.media.reduce((s, o) => s + o.size, 0),
        recoveryObjects: finalStorage.recovery.length,
        recoveryBytes: finalStorage.recovery.reduce((s, o) => s + o.size, 0),
      },
    },
    null,
    2,
  ) + '\n',
);
process.exitCode = failures ? 1 : 0;
