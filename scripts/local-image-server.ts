import { createServer } from 'node:http';
import { validateLocalImages } from './local-image-provider';
import type { ImageInputs } from '../apps/api/src/services/imageProvider';
import { LIMITS } from '../packages/shared/src/constants';
// Used only by synthetic local E2E runs. Never deployed or imported by production code.
export function localImageServer() {
  return createServer(async (request, response) => {
    if (request.socket.remoteAddress !== '127.0.0.1') {
      response.writeHead(403);
      response.end();
      return;
    }
    if (request.method !== 'POST' || request.url !== '/validate') {
      response.writeHead(405);
      response.end();
      return;
    }
    try {
      const parts: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > LIMITS.uploadBytes) {
          response.writeHead(413);
          response.end();
          return;
        }
        parts.push(chunk);
      }
      const body = Buffer.concat(parts);
      const form = await new Response(body, {
        headers: { 'Content-Type': request.headers['content-type'] ?? '' },
      }).formData();
      const input = {} as ImageInputs;
      for (const name of ['original', 'full', 'card', 'thumb'] as const) {
        const part = form.get(name);
        if (!(part instanceof File)) throw new Error('Missing image');
        input[name] = new Uint8Array(await part.arrayBuffer());
      }
      const verified = await validateLocalImages(input);
      const result = {
        original: verified.original,
        ...Object.fromEntries(
          (['full', 'card', 'thumb'] as const).map((name) => [
            name,
            {
              width: verified[name].width,
              height: verified[name].height,
              base64: Buffer.from(verified[name].bytes).toString('base64'),
            },
          ]),
        ),
      };
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(result));
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'invalid_image' }));
    }
  });
}
