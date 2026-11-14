import type { ImageValidator } from '../apps/api/src/services/imageProvider';
import sharp from 'sharp';
import { imageHeader, IMAGE_VARIANTS, LIMITS } from '../packages/shared/src';
// Local test provider only. Native decoding is deliberately excluded from Workers builds.
export const validateLocalImages: ImageValidator = async (input) => {
  const original = imageHeader(input.original);
  if (original.animated) throw new Error('Animated input is not supported.');
  const options = { failOn: 'warning' as const, limitInputPixels: LIMITS.originalPixels };
  const source = sharp(input.original, options);
  const metadata = await source.metadata();
  if ((metadata.pages ?? 1) > 1) throw new Error('Animated input is not supported.');
  if (metadata.width !== original.width || metadata.height !== original.height)
    throw new Error('Image dimensions disagree.');
  // stats forces full input decoding; metadata/header inspection alone is insufficient.
  await source.clone().stats();
  for (const [name, limits] of Object.entries(IMAGE_VARIANTS)) {
    const bytes = input[name as keyof typeof IMAGE_VARIANTS];
    if (bytes.length > limits.bytes) throw new Error('Variant is too large.');
    const header = imageHeader(bytes);
    if (
      header.mime !== 'image/webp' ||
      header.animated ||
      header.hasMetadata ||
      Math.max(header.width, header.height) > limits.edge
    )
      throw new Error('Invalid public derivative.');
    const decoded = await sharp(bytes, options).raw().toBuffer({ resolveWithObject: true });
    if (decoded.info.width !== header.width || decoded.info.height !== header.height)
      throw new Error('Variant dimensions disagree.');
  }
  const result = {
    original: { mime: original.mime, width: original.width, height: original.height },
  } as Awaited<ReturnType<ImageValidator>>;
  for (const [name, limits] of Object.entries(IMAGE_VARIANTS)) {
    const output = await source
      .clone()
      .rotate()
      .resize({ width: limits.edge, height: limits.edge, fit: 'inside', withoutEnlargement: true })
      .toColourspace('srgb')
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    if (output.data.length > limits.bytes) throw new Error('Prepared image is too large.');
    result[name as keyof typeof IMAGE_VARIANTS] = {
      width: output.info.width,
      height: output.info.height,
      bytes: new Uint8Array(output.data),
    };
  }
  return result;
};
