import { expect, test } from 'vitest';
import sharp from 'sharp';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
import { imageHeader } from '../../packages/shared/src/imageHeader';
import { validateLocalImages } from '../local-image-provider';
import { stripWebpMetadata } from '../../packages/shared/src/webp';
test('WebP metadata stripping preserves decoded pixels and removes EXIF, ICC and XMP chunks', async () => {
  const source = bytes(fixtures.metadata);
  const stripped = stripWebpMetadata(source);
  expect(imageHeader(stripped).hasMetadata).toBe(false);
  expect(await sharp(stripped).raw().toBuffer()).toEqual(await sharp(source).raw().toBuffer());
});
test('valid dimensions and chunk lengths do not make corrupt pixel data decodable', async () => {
  const original = bytes(fixtures.original);
  for (let offset = 8; offset < original.length;) {
    const size = new DataView(original.buffer).getUint32(offset);
    if (String.fromCharCode(...original.slice(offset + 4, offset + 8)) === 'IDAT') {
      original.fill(0, offset + 8, offset + 8 + size);
      break;
    }
    offset += 12 + size;
  }
  expect(imageHeader(original)).toMatchObject({ width: 60, height: 40 });
  await expect(validateLocalImages({ ...input(), original })).rejects.toThrow();
});
const bytes = (value: string) => new Uint8Array(Buffer.from(value, 'base64'));
const input = () => ({
  original: bytes(fixtures.original),
  full: bytes(fixtures.webp),
  card: bytes(fixtures.webp),
  thumb: bytes(fixtures.webp),
});
test('binary preflight recognizes actual formats/dimensions and rejects malformed and oversized input', () => {
  expect(imageHeader(bytes(fixtures.original))).toMatchObject({
    mime: 'image/png',
    width: 60,
    height: 40,
  });
  expect(imageHeader(bytes(fixtures.webp))).toMatchObject({
    mime: 'image/webp',
    width: 60,
    height: 40,
    hasMetadata: false,
  });
  expect(imageHeader(bytes(fixtures.oriented))).toMatchObject({
    mime: 'image/jpeg',
    width: 60,
    height: 40,
    hasMetadata: true,
  });
  expect(imageHeader(bytes(fixtures.metadata)).hasMetadata).toBe(true);
  expect(() => imageHeader(new Uint8Array([1, 2, 3]))).toThrow();
  const large = bytes(fixtures.original);
  new DataView(large.buffer).setUint32(16, 16385);
  expect(() => imageHeader(large)).toThrow();
});
test('local decoder fully decodes originals, regenerates safe WebP and retains orientation', async () => {
  const images = await validateLocalImages(input());
  expect(images.original).toEqual({ mime: 'image/png', width: 60, height: 40 });
  for (const variant of ['full', 'card', 'thumb'] as const) {
    const info = await sharp(images[variant].bytes).metadata();
    expect(info.format).toBe('webp');
    expect(info.exif).toBeUndefined();
    expect(info.xmp).toBeUndefined();
    expect(info.width).toBe(60);
  }
  const rotated = await validateLocalImages({ ...input(), original: bytes(fixtures.oriented) });
  expect(rotated.full.width).toBe(40);
  expect(rotated.full.height).toBe(60);
  expect((await sharp(rotated.full.bytes).metadata()).exif).toBeUndefined();
});
test('decode rejects a header-valid truncated source and metadata-bearing public variants', async () => {
  await expect(
    validateLocalImages({ ...input(), original: bytes(fixtures.original).slice(0, 35) }),
  ).rejects.toThrow();
  await expect(
    validateLocalImages({ ...input(), full: bytes(fixtures.metadata) }),
  ).rejects.toThrow();
});
