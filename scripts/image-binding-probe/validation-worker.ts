import type { Env } from '../../apps/api/src/env';
import { validateCloudflareImages } from '../../apps/api/src/services/cloudflareImages';
import { InvalidImage, type ImageInputs } from '../../apps/api/src/services/imageProvider';
export { JpegValidator } from '../../apps/api/src/services/jpegValidator';

// Isolated synthetic diagnostic: local Worker/DO, live Images binding, no application storage.
export default {
  async fetch(request: Request, env: Pick<Env, 'IMAGES' | 'JPEG_VALIDATOR'>) {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/validate')
      return new Response(null, { status: 404 });
    const length = Number(request.headers.get('Content-Length'));
    if (!length || length > 14 * 1024 * 1024) return new Response(null, { status: 413 });
    try {
      const form = await request.formData();
      const input = {} as ImageInputs;
      for (const name of ['original', 'full', 'card', 'thumb'] as const) {
        const file = form.get(name);
        if (!(file instanceof File)) return new Response(null, { status: 400 });
        input[name] = new Uint8Array(await file.arrayBuffer());
      }
      const result = await validateCloudflareImages(input, {
        images: env.IMAGES,
        validateJpeg: (bytes) =>
          env.JPEG_VALIDATOR.getByName('synthetic-portfolio').validate(bytes),
      });
      const output = new FormData();
      output.set('original', JSON.stringify(result.original));
      for (const name of ['full', 'card', 'thumb'] as const)
        output.set(
          name,
          new Blob([new Uint8Array(result[name].bytes)], { type: 'image/webp' }),
          `${name}.webp`,
        );
      return new Response(output, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      return Response.json(
        { error: error instanceof InvalidImage ? 'invalid_image' : 'validation_unavailable' },
        { status: error instanceof InvalidImage ? 400 : 503 },
      );
    }
  },
};
