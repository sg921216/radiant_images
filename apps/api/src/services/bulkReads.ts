import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../env';
import { createApp } from '../index';

export function bulkReadKey(method: string, path: string) {
  if (method !== 'GET' && method !== 'HEAD') return;
  if (path === '/public/bootstrap') return 'public';
  if (path === '/admin/gallery') return 'gallery';
  if (path === '/admin/clients') return 'clients';
}

// One admission coordinator per bulk read model, not one object for every request.
// D1 remains authoritative; no content or authorization decisions are cached here.
export class BulkReads extends DurableObject<Env> {
  private active = 0;
  private readonly app = createApp();

  protected async execute(request: Request): Promise<Response> {
    return this.app.fetch(request, this.env);
  }

  async fetch(request: Request): Promise<Response> {
    if (!bulkReadKey(request.method, new URL(request.url).pathname))
      return new Response(null, { status: 404 });
    if (this.active >= 8)
      return Response.json(
        {
          error: {
            code: 'temporarily_unavailable',
            message: 'The website is busy. Try again shortly.',
          },
        },
        { status: 503, headers: { 'Retry-After': '2', 'Cache-Control': 'no-store' } },
      );
    this.active++;
    try {
      return await this.execute(request);
    } finally {
      this.active--;
    }
  }
}
