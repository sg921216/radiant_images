import { afterEach, expect, test, vi } from 'vitest';
import sharp from 'sharp';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
import { validateCloudflareImages } from '../../apps/api/src/services/cloudflareImages';
import {
  InvalidImage,
  type ImageValidationContext,
} from '../../apps/api/src/services/imageProvider';
import { assertJpegComplete } from '../../packages/shared/src/jpeg';
import { imageHeader } from '../../packages/shared/src/imageHeader';

const bytes = (value: string) => new Uint8Array(Buffer.from(value, 'base64'));
const input = () => ({
  original: bytes(fixtures.original),
  full: bytes(fixtures.webp),
  card: bytes(fixtures.webp),
  thumb: bytes(fixtures.webp),
});
function context(): ImageValidationContext {
  return {
    validateJpeg: vi.fn(async (value) => {
      try {
        assertJpegComplete(value);
        return true;
      } catch {
        return false;
      }
    }),
    images: {
      info: async (stream) => {
        const data = await new Response(stream).arrayBuffer();
        const info = await sharp(data).metadata();
        const swap = (info.orientation ?? 1) >= 5;
        return {
          format: `image/${info.format}`,
          width: (swap ? info.height : info.width)!,
          height: (swap ? info.width : info.height)!,
          fileSize: data.byteLength,
        };
      },
      input: vi.fn((stream) => {
        const data = new Response(stream).arrayBuffer();
        let resize: ImageTransform | undefined;
        const chain: ImageTransformer = {
          transform: (options) => {
            resize = options;
            return chain;
          },
          draw: () => {
            throw new Error('Not used');
          },
          output: async () => {
            let pipeline = sharp(await data, { failOn: 'none' }).rotate();
            if (resize)
              pipeline = pipeline.resize({
                width: resize.width,
                height: resize.height,
                fit: 'inside',
                withoutEnlargement: true,
              });
            const encoded = new Uint8Array(await pipeline.webp({ quality: 80 }).toBuffer());
            return {
              response: () => new Response(encoded, { headers: { 'Content-Type': 'image/webp' } }),
              image: () => new Response(encoded).body!,
              contentType: () => 'image/webp',
            };
          },
        };
        return chain;
      }),
    },
  };
}
afterEach(() => vi.useRealTimers());

test('production adapter regenerates derivatives from the original, not substituted client photos', async () => {
  const forged = new Uint8Array(
    await sharp({ create: { width: 60, height: 40, channels: 3, background: 'blue' } })
      .webp()
      .toBuffer(),
  );
  const result = await validateCloudflareImages(
    { ...input(), full: forged, card: forged, thumb: forged },
    context(),
  );
  expect(result.original).toEqual({ mime: 'image/png', width: 60, height: 40 });
  const expected = await sharp(bytes(fixtures.original)).rotate().webp({ quality: 80 }).toBuffer();
  expect(Buffer.from(result.full.bytes)).toEqual(expected);
  expect(Buffer.from(result.full.bytes)).not.toEqual(Buffer.from(forged));
  for (const variant of ['full', 'card', 'thumb'] as const)
    expect(imageHeader(result[variant].bytes)).toMatchObject({
      animated: false,
      hasMetadata: false,
      mime: 'image/webp',
    });
});

test('rejects damaged JPEG scans before any transformation and allows an intact re-export', async () => {
  const jpeg = await sharp(bytes(fixtures.original)).jpeg().toBuffer();
  const ctx = context();
  for (const original of [
    jpeg.subarray(0, -20),
    Buffer.concat([jpeg.subarray(0, -20), Buffer.from([255, 217])]),
  ])
    await expect(validateCloudflareImages({ ...input(), original }, ctx)).rejects.toBeInstanceOf(
      InvalidImage,
    );
  expect(ctx.images.input).not.toHaveBeenCalled();
  expect((await validateCloudflareImages({ ...input(), original: jpeg }, ctx)).original.mime).toBe(
    'image/jpeg',
  );
});

test('oriented provider metadata is reconciled with encoded source dimensions', async () => {
  const result = await validateCloudflareImages(
    { ...input(), original: bytes(fixtures.oriented) },
    context(),
  );
  expect(result.original).toEqual({ mime: 'image/jpeg', width: 60, height: 40 });
  expect(result.full).toMatchObject({ width: 40, height: 60 });
});

test('missing bindings and unavailable strict validation fail closed', async () => {
  await expect(validateCloudflareImages(input())).rejects.toThrow();
  const ctx = context();
  ctx.validateJpeg = async () => {
    throw new Error('synthetic outage');
  };
  await expect(
    validateCloudflareImages({ ...input(), original: bytes(fixtures.oriented) }, ctx),
  ).rejects.toThrow();
  expect(ctx.images.input).not.toHaveBeenCalled();
});

test('corrupt or metadata-bearing client derivatives cannot be published', async () => {
  await expect(
    validateCloudflareImages({ ...input(), full: bytes(fixtures.metadata) }, context()),
  ).rejects.toBeInstanceOf(InvalidImage);
  const corrupted = bytes(fixtures.webp);
  corrupted.fill(255, 30);
  await expect(
    validateCloudflareImages({ ...input(), full: corrupted }, context()),
  ).rejects.toThrow();
});

test('provider calls have a bounded deadline', async () => {
  vi.useFakeTimers();
  const ctx = context();
  ctx.images.info = () => new Promise(() => {});
  const pending = expect(validateCloudflareImages(input(), ctx)).rejects.toThrow(
    /unavailable|timeout/i,
  );
  await Promise.all([pending, vi.advanceTimersByTimeAsync(8_000)]);
});

test('provider outages and invalid options are not reported as damaged user photos', async () => {
  for (const code of [9401, 9422, 9516, 9523]) {
    const ctx = context();
    const outage = Object.assign(new Error('synthetic provider failure'), { code });
    ctx.images.info = async () => {
      throw outage;
    };
    await expect(validateCloudflareImages(input(), ctx)).rejects.toBe(outage);
  }
});

test('a stalled output stream and cancellation cannot bypass the processing deadline', async () => {
  vi.useFakeTimers();
  const ctx = context();
  ctx.images.info = async () => ({
    format: 'image/png',
    width: 60,
    height: 40,
    fileSize: input().original.length,
  });
  ctx.images.input = () => {
    const chain: ImageTransformer = {
      transform: () => chain,
      draw: () => {
        throw new Error('Not used');
      },
      output: async () => ({
        contentType: () => 'image/webp',
        response: () => {
          throw new Error('Not used');
        },
        image: () => new ReadableStream({ cancel: () => new Promise(() => {}) }),
      }),
    };
    return chain;
  };
  let outcome = 'pending';
  const settled = validateCloudflareImages(input(), ctx).then(
    () => {
      outcome = 'published';
    },
    () => {
      outcome = 'rejected';
    },
  );
  await vi.advanceTimersByTimeAsync(30_000);
  expect(outcome).toBe('rejected');
  await settled;
});
