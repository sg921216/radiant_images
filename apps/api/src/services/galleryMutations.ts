import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../env';
import { createApp } from '../index';

export function isGalleryMutation(method: string, path: string) {
  return (
    (method === 'POST' && path === '/admin/gallery') ||
    (method === 'DELETE' && /^\/admin\/gallery\/[^/]+$/.test(path))
  );
}

export class GalleryMutations extends DurableObject<Env> {
  private busy = false;
  private readonly app = createApp();

  async fetch(request: Request): Promise<Response> {
    if (!isGalleryMutation(request.method, new URL(request.url).pathname))
      return new Response(null, { status: 404 });
    if (this.busy)
      return Response.json(
        {
          error: {
            code: 'rate_limited',
            message: 'Another photo change is in progress. Try again shortly.',
          },
        },
        { status: 429, headers: { 'Retry-After': '2', 'Cache-Control': 'no-store' } },
      );
    this.busy = true;
    try {
      // Reuse the same auth, byte limits, validation and publication code. Streaming
      // into this coordinator keeps multipart/recovery CPU out of the front Worker.
      return await this.app.fetch(request, this.env);
    } finally {
      this.busy = false;
    }
  }
}
