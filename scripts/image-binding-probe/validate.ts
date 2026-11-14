import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
import { IMAGE_VARIANTS } from '../../packages/shared/src/index';
import { imageHeader } from '../../packages/shared/src/imageHeader';

// Explicit synthetic probe, outside routine tests. Start validation.wrangler.toml locally.
const source = Buffer.from(fixtures.original, 'base64');
const jpeg = await sharp(source).jpeg().toBuffer();
const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#765432' } });
const cases = [
  { name: 'png', bytes: source, status: 200 },
  { name: 'webp', bytes: Buffer.from(fixtures.webp, 'base64'), status: 200 },
  { name: 'jpeg-re-export', bytes: jpeg, status: 200 },
  { name: 'jpeg-exif-orientation', bytes: Buffer.from(fixtures.oriented, 'base64'), status: 200 },
  { name: 'jpeg-truncated-scan', bytes: jpeg.subarray(0, -20), status: 400 },
  {
    name: 'jpeg-truncated-scan-with-end-marker',
    bytes: Buffer.concat([jpeg.subarray(0, -20), Buffer.from([255, 217])]),
    status: 400,
  },
  { name: 'jpeg-40mp-baseline', bytes: await solid(8000, 5000).jpeg().toBuffer(), status: 200 },
  {
    name: 'jpeg-40mp-progressive-444',
    bytes: await solid(8000, 5000)
      .jpeg({ progressive: true, chromaSubsampling: '4:4:4' })
      .toBuffer(),
    status: 200,
  },
  { name: 'jpeg-16384-axis', bytes: await solid(16384, 2000).jpeg().toBuffer(), status: 200 },
];
// Pad with legal APP15 segments to exercise the exact 10 MiB input limit.
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
  name: 'jpeg-10mib-metadata',
  bytes: Buffer.concat([jpeg.subarray(0, 2), ...padding, jpeg.subarray(2)]),
  status: 200,
});
const results: Record<string, unknown>[] = [];
let failures = 0;
for (const entry of cases) {
  const form = new FormData();
  form.set('original', new Blob([entry.bytes]), 'synthetic-original');
  const variantSource = entry.status === 200 ? entry.bytes : source;
  const expected = await sharp(variantSource).metadata();
  for (const name of ['full', 'card', 'thumb'] as const) {
    const edge = IMAGE_VARIANTS[name].edge;
    const encoded = await sharp(variantSource)
      .rotate()
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
      .webp()
      .toBuffer();
    form.set(name, new Blob([encoded]), `${name}.webp`);
  }
  const started = performance.now();
  const result: Record<string, unknown> = {
    name: entry.name,
    inputBytes: entry.bytes.length,
    inputSha256: createHash('sha256').update(entry.bytes).digest('hex'),
    expectedStatus: entry.status,
  };
  try {
    const response = await fetch('http://127.0.0.1:8795/validate', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(45_000),
    });
    result.status = response.status;
    assert.equal(response.status, entry.status);
    if (response.ok) {
      const output = await response.formData();
      const original = JSON.parse(String(output.get('original')));
      assert.deepEqual(original, {
        mime: `image/${expected.format}`,
        width: expected.width,
        height: expected.height,
      });
      result.original = original;
      const variants: Record<string, unknown> = {};
      for (const name of ['full', 'card', 'thumb'] as const) {
        const part = output.get(name);
        assert(part instanceof File);
        const data = Buffer.from(await part.arrayBuffer());
        const info = imageHeader(data);
        assert.equal(info.mime, 'image/webp');
        assert.equal(info.hasMetadata, false);
        assert.equal(info.animated, false);
        assert(data.length <= IMAGE_VARIANTS[name].bytes);
        assert(Math.max(info.width, info.height) <= IMAGE_VARIANTS[name].edge);
        const swapped = (expected.orientation ?? 1) >= 5;
        const width = (swapped ? expected.height : expected.width)!;
        const height = (swapped ? expected.width : expected.height)!;
        const scale = Math.min(1, IMAGE_VARIANTS[name].edge / Math.max(width, height));
        assert(
          Math.abs(info.width - width * scale) <= 1 && Math.abs(info.height - height * scale) <= 1,
        );
        await sharp(data, { failOn: 'warning' }).stats();
        variants[name] = {
          width: info.width,
          height: info.height,
          bytes: data.length,
          sha256: createHash('sha256').update(data).digest('hex'),
          strictDecodePassed: true,
          metadataFree: true,
        };
      }
      result.variants = variants;
    } else assert.deepEqual(await response.json(), { error: 'invalid_image' });
    result.passed = true;
  } catch {
    result.passed = false;
    failures++;
  }
  result.elapsedMs = Math.round(performance.now() - started);
  results.push(result);
  console.log(
    `${entry.name}: ${result.passed ? 'PASS' : 'FAIL'} (${result.status ?? 'transport error'})`,
  );
}
await writeFile(
  'specs/001-radiant-images-website/evidence/images-validation-probe.json',
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      scope:
        'Local workerd Worker and SQLite Durable Object RPC; live Cloudflare Images binding. Synthetic data only. No application deployment, storage, or paid activation. Does not measure deployed CPU/memory.',
      command:
        'pnpm exec wrangler dev --config scripts/image-binding-probe/validation.wrangler.toml --ip 127.0.0.1 --port 8795 --inspector-port 9245 --show-interactive-dev-session=false',
      runner: 'pnpm exec tsx scripts/image-binding-probe/validate.ts',
      node: process.version,
      sharp: sharp.versions.sharp,
      results,
      failures,
    },
    null,
    2,
  ) + '\n',
);
process.exitCode = failures ? 1 : 0;
