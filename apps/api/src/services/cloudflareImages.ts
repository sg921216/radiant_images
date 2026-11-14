import { IMAGE_VARIANTS, imageHeader } from '@radiant/shared';
import { InvalidImage, type ImageValidator, type DecodedImage } from './imageProvider';

export const validateCloudflareImages: ImageValidator = async (input, context) => {
  if (!context) throw new Error('Image validation is not configured.');
  const { images, validateJpeg } = context;
  const deadline = Date.now() + 30_000;
  async function bounded<T>(operation: () => Promise<T>, budget = 8_000): Promise<T> {
    const remaining = Math.min(budget, deadline - Date.now());
    if (remaining <= 0) throw new Error('Image validation timeout.');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Image validation timeout.')), remaining);
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
  const stream = (bytes: Uint8Array) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
  const checkInput = (bytes: Uint8Array) => {
    try {
      return imageHeader(bytes);
    } catch {
      throw new InvalidImage();
    }
  };
  const source = checkInput(input.original);
  if (source.animated) throw new InvalidImage();
  for (const name of ['full', 'card', 'thumb'] as const) {
    const header = checkInput(input[name]);
    if (
      header.mime !== 'image/webp' ||
      header.animated ||
      header.hasMetadata ||
      input[name].length > IMAGE_VARIANTS[name].bytes ||
      Math.max(header.width, header.height) > IMAGE_VARIANTS[name].edge
    )
      throw new InvalidImage();
  }
  if (source.mime === 'image/jpeg' && !(await bounded(() => validateJpeg(input.original), 20_000)))
    throw new InvalidImage();

  try {
    const info = await bounded(() => images.info(stream(input.original)));
    if (
      !('width' in info) ||
      info.format !== source.mime ||
      info.fileSize !== input.original.length ||
      !(
        (info.width === source.width && info.height === source.height) ||
        (info.width === source.height && info.height === source.width)
      )
    )
      throw new Error('Image provider dimensions disagree.');
    async function render(
      bytes: Uint8Array,
      name: keyof typeof IMAGE_VARIANTS,
      resize: boolean,
    ): Promise<DecodedImage> {
      const limit = IMAGE_VARIANTS[name];
      let chain = images.input(stream(bytes));
      if (resize)
        chain = chain.transform({ width: limit.edge, height: limit.edge, fit: 'scale-down' });
      const output = await bounded(() =>
        chain.output({ format: 'image/webp', quality: 80, anim: false }),
      );
      if (output.contentType() !== 'image/webp') throw new Error('Unsafe image provider output.');
      const reader = output.image().getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        for (;;) {
          const { value, done } = await bounded(() => reader.read());
          if (done) break;
          length += value.length;
          if (length > limit.bytes) throw new InvalidImage();
          chunks.push(value);
        }
      } catch (error) {
        await bounded(() => reader.cancel()).catch(() => undefined);
        throw error;
      } finally {
        reader.releaseLock();
      }
      const clean = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        clean.set(chunk, offset);
        offset += chunk.length;
      }
      const header = imageHeader(clean);
      if (
        header.mime !== 'image/webp' ||
        header.animated ||
        header.hasMetadata ||
        Math.max(header.width, header.height) > limit.edge
      )
        throw new Error('Unsafe image provider output.');
      return { bytes: clean, width: header.width, height: header.height };
    }
    // Decode every supplied derivative, but publish only new derivatives of the source.
    for (const name of ['full', 'card', 'thumb'] as const) {
      const header = checkInput(input[name]);
      const decoded = await render(input[name], name, false);
      if (decoded.width !== header.width || decoded.height !== header.height)
        throw new InvalidImage();
    }
    const full = await render(input.original, 'full', true);
    const card = await render(input.original, 'card', true);
    const thumb = await render(input.original, 'thumb', true);
    return {
      original: { mime: source.mime, width: source.width, height: source.height },
      full,
      card,
      thumb,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      typeof error.code === 'number' &&
      [9412, 9520].includes(error.code)
    )
      throw new InvalidImage();
    // Unknown errors, including 9516, are provider failures, never proof of invalid input.
    throw error;
  }
};
