// Local-only entry point. Never deploy: connects to the private rehearsal through a
// service binding and inspects only that rehearsal's disposable R2 buckets.
type ProxyEnv = Pick<ApiBindings, 'MEDIA' | 'RECOVERY'> & { TARGET: Fetcher };
export default {
  async fetch(request: Request, env: ProxyEnv) {
    const url = new URL(request.url);
    if (url.pathname === '/__storage' && request.method === 'GET') {
      const media = await env.MEDIA.list();
      const recovery = await env.RECOVERY.list();
      return Response.json({
        media: media.objects.map((o) => ({ key: o.key, size: o.size })),
        recovery: recovery.objects.map((o) => ({ key: o.key, size: o.size })),
      });
    }
    if (url.pathname === '/__empty-storage' && request.method === 'POST') {
      for (const bucket of [env.MEDIA, env.RECOVERY]) {
        const page = await bucket.list();
        if (page.truncated) throw new Error('Unexpected rehearsal volume; inspect before cleanup.');
        if (page.objects.length) await bucket.delete(page.objects.map((o) => o.key));
      }
      return Response.json({ emptied: true });
    }
    if (!/^\/(admin\/gallery(?:\/|$)|images\/|originals\/|public\/)/.test(url.pathname))
      return new Response(null, { status: 404 });
    return env.TARGET.fetch(
      new Request(`https://api.rehearsal.invalid${url.pathname}${url.search}`, request),
    );
  },
};
