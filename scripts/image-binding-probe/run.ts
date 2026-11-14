import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
import { imageHeader } from '../../packages/shared/src/imageHeader';

// Explicit diagnostic, never included in routine tests or the application bundle.
// Run only against the isolated loopback `wrangler dev --remote` session.
const endpoint = 'http://127.0.0.1:8795/transform';
const decode = (value: string) => Buffer.from(value, 'base64');
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const cases: { name: string; bytes: Buffer; accept: boolean; edge?: number }[] = [
  { name: 'png', bytes: decode(fixtures.original), accept: true },
  { name: 'webp', bytes: decode(fixtures.webp), accept: true },
  { name: 'jpeg-exif-orientation', bytes: decode(fixtures.oriented), accept: true },
  { name: 'webp-exif-icc-xmp', bytes: decode(fixtures.metadata), accept: true },
];
const corruptPng = decode(fixtures.original);
for (let offset = 8; offset < corruptPng.length;) {
  const length = corruptPng.readUInt32BE(offset);
  if (corruptPng.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
    corruptPng.fill(0, offset + 8, offset + 8 + length);
    corruptPng.writeUInt32BE(
      crc32(corruptPng.subarray(offset + 4, offset + 8 + length)),
      offset + 8 + length,
    );
    break;
  }
  offset += length + 12;
}
cases.push({ name: 'png-corrupt-pixels-valid-crc', bytes: corruptPng, accept: false });
const jpeg = await sharp(decode(fixtures.original)).jpeg().toBuffer();
cases.push({
  name: 'jpeg-truncated-scan',
  bytes: jpeg.subarray(0, jpeg.length - 20),
  accept: false,
});
cases.push({
  name: 'jpeg-truncated-scan-with-end-marker',
  bytes: Buffer.concat([jpeg.subarray(0, jpeg.length - 20), Buffer.from([255, 217])]),
  accept: false,
});
const webp = decode(fixtures.webp);
const corruptWebp = Buffer.from(webp);
for (let offset = 12; offset < corruptWebp.length;) {
  const length = corruptWebp.readUInt32LE(offset + 4);
  if (corruptWebp.toString('ascii', offset, offset + 4) === 'VP8 ') {
    corruptWebp.fill(255, offset + 18, offset + 8 + length);
    break;
  }
  offset += length + 8 + (length % 2);
}
cases.push({ name: 'webp-corrupt-pixels', bytes: corruptWebp, accept: false });
const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#846f58' } });
const maxPixels = await solid(8000, 5000).png().toBuffer();
for (const edge of [2000, 800, 320])
  cases.push({ name: `40mp-${edge}`, bytes: maxPixels, accept: true, edge });
cases.push({
  name: 'jpeg-16384-axis',
  bytes: await solid(16384, 2000).jpeg().toBuffer(),
  accept: true,
});
cases.push({
  name: 'png-16384-axis',
  bytes: await solid(16384, 2000).png().toBuffer(),
  accept: true,
});
const source = decode(fixtures.original);
const paddingSize = 10_485_760 - source.length - 12;
const padding = Buffer.alloc(paddingSize + 12, 65);
padding.writeUInt32BE(paddingSize, 0);
padding.write('tEXt', 4, 'ascii');
padding.write('probe\0', 8, 'ascii');
padding.writeUInt32BE(crc32(padding.subarray(4, paddingSize + 8)), paddingSize + 8);
cases.push({
  name: 'png-10mib-metadata',
  bytes: Buffer.concat([source.subarray(0, -12), padding, source.subarray(-12)]),
  accept: true,
});

const selection = new Set(process.argv.slice(2));
for (const name of selection)
  if (!cases.some((entry) => entry.name === name)) throw new Error(`Unknown probe case: ${name}`);
const results = [];
for (const entry of cases.filter((entry) => selection.size === 0 || selection.has(entry.name))) {
  const started = performance.now();
  let header;
  try {
    header = imageHeader(entry.bytes);
  } catch {
    header = null;
  }
  let strictLocalDecode = true;
  try {
    await sharp(entry.bytes, { failOn: 'warning', limitInputPixels: 40_000_000 }).stats();
  } catch {
    strictLocalDecode = false;
  }
  const input = { bytes: entry.bytes.length, sha256: hash(entry.bytes), header, strictLocalDecode };
  try {
    const response = await fetch(`${endpoint}?edge=${entry.edge ?? 2000}`, {
      method: 'POST',
      body: new Uint8Array(entry.bytes),
      signal: AbortSignal.timeout(60_000),
    });
    if (response.ok) {
      const output = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(output, { failOn: 'warning' }).metadata();
      await sharp(output, { failOn: 'warning' }).stats();
      const outputHeader = imageHeader(output);
      const accepted =
        !outputHeader.hasMetadata &&
        !outputHeader.animated &&
        Math.max(outputHeader.width, outputHeader.height) <= (entry.edge ?? 2000);
      const result = {
        name: entry.name,
        input,
        expected: entry.accept ? 'accept' : 'reject',
        status: response.status,
        passed: entry.accept && accepted,
        info: JSON.parse(response.headers.get('X-Probe-Info') ?? 'null') as unknown,
        output: {
          bytes: output.length,
          sha256: hash(output),
          header: outputHeader,
          exif: !!metadata.exif,
          icc: !!metadata.icc,
          xmp: !!metadata.xmp,
        },
        providerWarning: response.headers.get('Cf-Resized'),
        elapsedMs: Math.round(performance.now() - started),
      };
      results.push(result);
      console.log(
        JSON.stringify({
          name: entry.name,
          status: response.status,
          passed: result.passed,
          output: outputHeader,
        }),
      );
    } else {
      const contentType = response.headers.get('Content-Type');
      let error: { code?: number | null; info?: unknown; nonJsonResponse?: boolean };
      if (contentType?.includes('application/json')) {
        error = (await response.json()) as { code?: number | null; info?: unknown };
      } else {
        await response.body?.cancel();
        error = { nonJsonResponse: true };
      }
      const passed = !entry.accept && [9401, 9412, 9520, 9523].includes(error.code ?? 0);
      results.push({
        name: entry.name,
        input,
        expected: entry.accept ? 'accept' : 'reject',
        status: response.status,
        contentType,
        error,
        passed,
        elapsedMs: Math.round(performance.now() - started),
      });
      console.log(JSON.stringify({ name: entry.name, status: response.status, error, passed }));
    }
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown';
    results.push({ name: entry.name, input, passed: false, transportOrDecodeError: reason });
    console.log(
      JSON.stringify({ name: entry.name, passed: false, transportOrDecodeError: reason }),
    );
  }
}
await writeFile(
  new URL(
    `../../specs/001-radiant-images-website/evidence/images-binding-probe${selection.size ? '-followup' : ''}.json`,
    import.meta.url,
  ),
  `${JSON.stringify({ observedAt: new Date().toISOString(), scope: 'Synthetic fixtures through wrangler dev --remote; no D1/R2 bindings or application deployment', wranglerVersion: '4.162.0', results }, null, 2)}\n`,
);
if (results.some((result) => !result.passed)) process.exitCode = 1;
