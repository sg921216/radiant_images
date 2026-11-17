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
  private readonly app = createApp(undefined, false, () => this.reserveUpload());

  private async reserveUpload(): Promise<number> {
    const now = Date.now();
    const window = 30 * 86400000;
    const saved = (await this.ctx.storage.get<unknown>('upload-attempts')) ?? [];
    if (
      !Array.isArray(saved) ||
      saved.length > 300 ||
      saved.some((at) => !Number.isSafeInteger(at) || at < 0 || at > now)
    )
      throw new Error('upload_budget_invalid');
    const recent: number[] = saved.filter((at: number) => at > now - window);
    if (recent.length >= 300)
      return Math.max(1, Math.ceil((Math.min(...recent) + window - now) / 1000));
    // The existing single-mutation gate serializes this durable reservation. Failed
    // attempts remain charged: decoding failures can still consume provider usage.
    await this.ctx.storage.put('upload-attempts', [...recent, now]);
    return 0;
  }

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
