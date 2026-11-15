import { expect, test } from 'vitest';
import sharp from 'sharp';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
import { assertJpegComplete } from '../../packages/shared/src/jpeg';

const source = Buffer.from(fixtures.original, 'base64');
const segment = (marker: number, body: number[]) => [
  255,
  marker,
  (body.length + 2) >> 8,
  (body.length + 2) & 255,
  ...body,
];
// Two gray MCUs separated by a restart, using one-bit zero DC/EOB Huffman codes.
function restartJpeg() {
  return Uint8Array.from([
    255,
    216,
    ...segment(219, [0, ...Array<number>(64).fill(1)]),
    ...segment(192, [8, 0, 8, 0, 16, 1, 1, 17, 0]),
    ...segment(196, [
      0,
      1,
      ...Array<number>(15).fill(0),
      0,
      16,
      1,
      ...Array<number>(15).fill(0),
      0,
    ]),
    ...segment(221, [0, 1]),
    ...segment(218, [1, 1, 0, 0, 63, 0]),
    63,
    255,
    208,
    63,
    255,
    217,
  ]);
}

test('rejects the provider-tolerated truncated JPEG, including a forged end marker', async () => {
  const valid = await sharp(source).jpeg().toBuffer();
  for (const bytes of [
    valid.subarray(0, -20),
    Buffer.concat([valid.subarray(0, -20), Buffer.from([255, 217])]),
  ])
    expect(() => assertJpegComplete(bytes)).toThrow();
});

test('accepts baseline/progressive, chroma sampling, grayscale, CMYK and EXIF orientation', async () => {
  const pixels = Buffer.from(
    Array.from({ length: 37 * 29 * 3 }, (_, i) => (i * 47 + (i >> 4)) % 256),
  );
  for (const progressive of [false, true])
    for (const chromaSubsampling of ['4:2:0', '4:4:4'])
      for (const quality of [30, 80, 100]) {
        const bytes = await sharp(pixels, { raw: { width: 37, height: 29, channels: 3 } })
          .jpeg({ progressive, chromaSubsampling, quality })
          .toBuffer();
        expect(() => assertJpegComplete(bytes)).not.toThrow();
      }
  for (const colourspace of ['b-w', 'cmyk']) {
    const bytes = await sharp(source)
      .toColourspace(colourspace)
      .jpeg({ progressive: true })
      .toBuffer();
    expect(() => assertJpegComplete(bytes)).not.toThrow();
  }
  expect(() => assertJpegComplete(Buffer.from(fixtures.oriented, 'base64'))).not.toThrow();
});

test('validates restart sequence, entropy padding and exact MCU counts', async () => {
  const valid = restartJpeg();
  await sharp(valid, { failOn: 'warning' }).stats();
  expect(() => assertJpegComplete(valid)).not.toThrow();
  const wrongRestart = valid.slice();
  wrongRestart[wrongRestart.length - 4] = 209;
  const badPadding = valid.slice();
  badPadding[badPadding.length - 6] = 0;
  const missingMcu = Uint8Array.from([...valid.slice(0, -3), 255, 217]);
  for (const bytes of [wrongRestart, badPadding, missingMcu])
    expect(() => assertJpegComplete(bytes)).toThrow();
});

test('rejects missing end markers, extra entropy bytes and incomplete progressive scans', async () => {
  for (const progressive of [false, true]) {
    const bytes = await sharp(source).jpeg({ progressive }).toBuffer();
    const extraEntropy = Buffer.concat([
      bytes.subarray(0, -2),
      Buffer.from([17]),
      bytes.subarray(-2),
    ]);
    expect(() => assertJpegComplete(bytes.subarray(0, -2))).toThrow();
    expect(() => assertJpegComplete(extraEntropy)).toThrow();
    for (const removed of [3, 20])
      expect(() =>
        assertJpegComplete(Buffer.concat([bytes.subarray(0, -removed), Buffer.from([255, 217])])),
      ).toThrow();
  }
});

test('accepts a 40-megapixel progressive source without allocating decoded pixel buffers', async () => {
  const bytes = await sharp({
    create: { width: 8000, height: 5000, channels: 3, background: '#765432' },
  })
    .jpeg({ progressive: true, chromaSubsampling: '4:4:4' })
    .toBuffer();
  expect(() => assertJpegComplete(bytes)).not.toThrow();
});

test('scan truncation sweep agrees with strict decoding for baseline and progressive photos', async () => {
  const pixels = Buffer.from(
    Array.from({ length: 83 * 61 * 3 }, (_, i) => (i * 47 + (i >> 3)) % 256),
  );
  let rejected = 0;
  for (const progressive of [false, true]) {
    const valid = await sharp(pixels, { raw: { width: 83, height: 61, channels: 3 } })
      .jpeg({ progressive })
      .toBuffer();
    const scan = valid.indexOf(Buffer.from([255, 218]));
    for (let cut = scan + 4; cut < valid.length - 2; cut += 37) {
      const damaged = Buffer.concat([valid.subarray(0, cut), Buffer.from([255, 217])]);
      let strictFailure = false;
      try {
        await sharp(damaged, { failOn: 'warning' }).stats();
      } catch {
        strictFailure = true;
      }
      if (strictFailure) {
        rejected++;
        expect(
          () => assertJpegComplete(damaged),
          `progressive=${progressive}, cut=${cut}`,
        ).toThrow();
      }
    }
  }
  expect(rejected).toBeGreaterThan(100);
});

test('rejects malformed quantization/Huffman tables, unsupported frames and trailing data', () => {
  const valid = restartJpeg();
  const quantization = valid.slice();
  quantization[7] = 0;
  const huffman = valid.slice();
  const dht = Buffer.from(valid).indexOf(Buffer.from([255, 196]));
  huffman[dht + 5] = 2;
  const unsupported = valid.slice();
  const sof = Buffer.from(valid).indexOf(Buffer.from([255, 192]));
  unsupported[sof + 1] = 195;
  for (const damaged of [quantization, huffman, unsupported, Uint8Array.from([...valid, 1])])
    expect(() => assertJpegComplete(damaged)).toThrow();
});
