// Deploy only as an isolated private diagnostic, with TARGET bound to a rehearsal API.
// Wrangler's local remote-binding proxy buffers uploads. Throttle on Cloudflare itself
// to exercise the real coordinator under a slow incoming stream without modifying it.
export default {
  async fetch(request: Request, env: { TARGET: Pick<Fetcher, 'fetch'> }) {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/admin/gallery')
      return env.TARGET.fetch(request);
    if (!request.body) return new Response(null, { status: 400 });
    const reader = request.body.getReader();
    let pending = new Uint8Array();
    let sincePause = 0;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (!pending.length) {
          const chunk = await reader.read();
          if (chunk.done) return controller.close();
          pending = new Uint8Array(chunk.value);
        }
        const chunk = pending.subarray(0, 32_768);
        sincePause += chunk.length;
        if (sincePause >= 32_768) {
          await new Promise((resolve) => setTimeout(resolve, 75));
          sincePause -= 32_768;
        }
        controller.enqueue(chunk);
        pending = pending.subarray(32_768);
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });
    const headers = new Headers(request.headers);
    headers.delete('Content-Length');
    const init: RequestInit & { duplex: 'half' } = { headers, body, duplex: 'half' };
    return env.TARGET.fetch(new Request(request, init));
  },
};
