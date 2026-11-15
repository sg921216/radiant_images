import { IMAGE_VARIANTS, LIMITS, imageHeader, stripWebpMetadata } from '@radiant/shared';
export async function prepareImage(file: File): Promise<FormData> {
  if (file.size > LIMITS.originalBytes) throw new Error('Choose a photo no larger than 10 MiB.');
  const header = imageHeader(new Uint8Array(await file.arrayBuffer()));
  if (header.mime !== file.type)
    throw new Error('The photo format does not match its file type. Choose JPEG, PNG, or WebP.');
  if (header.animated) throw new Error('Choose a still photo. Animated images are not supported.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This photo could not be decoded. Try exporting a new JPEG or PNG.');
  }
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width > LIMITS.originalAxis ||
      bitmap.height > LIMITS.originalAxis ||
      bitmap.width * bitmap.height > LIMITS.originalPixels
    )
      throw new Error('The photo dimensions exceed the supported limits.');
    const form = new FormData();
    form.set('original', file);
    form.set('originalMime', header.mime);
    form.set('originalBytes', String(file.size));
    for (const [name, limits] of Object.entries(IMAGE_VARIANTS)) {
      const scale = Math.min(1, limits.edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { colorSpace: 'srgb' });
      if (!context)
        throw new Error(
          'This browser could not prepare your photo. Try another supported browser.',
        );
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob: Blob | null = null;
      for (const quality of [0.82, 0.72, 0.62, 0.5]) {
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/webp', quality),
        );
        if (!blob || blob.type !== 'image/webp')
          throw new Error('This browser cannot create WebP photos. Try another supported browser.');
        if (blob.size <= limits.bytes) break;
      }
      if (!blob || blob.size > limits.bytes)
        throw new Error(
          'This photo is too detailed to fit the upload limits. Try a smaller export.',
        );
      const clean = stripWebpMetadata(new Uint8Array(await blob.arrayBuffer()));
      form.set(name, new Blob([clean], { type: 'image/webp' }), `${name}.webp`);
      if (name === 'full') {
        form.set('width', String(canvas.width));
        form.set('height', String(canvas.height));
      }
    }
    return form;
  } finally {
    bitmap.close();
  }
}
