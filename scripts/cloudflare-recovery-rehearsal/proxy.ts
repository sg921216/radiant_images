// Loopback-only diagnostic. Never deploy. Its read path is independent of the application.
type ProxyEnv = Pick<ApiBindings, 'MEDIA' | 'RECOVERY'> & { TARGET: Fetcher };
export default {
  async fetch(request: Request, env: ProxyEnv) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      if (
        [
          '/objects/operations/maintenance.json',
          '/objects/operations/backup.json',
          '/objects/health/latest.json',
          '/objects/rehearsal/cron.json',
        ].includes(url.pathname)
      ) {
        const object = await env.RECOVERY.get(url.pathname.slice('/objects/'.length));
        if (!object) return Response.json(null);
        if (object.size > 4096) return new Response(null, { status: 502 });
        return new Response(object.body, { headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname === '/objects') {
        const cursor = url.searchParams.get('cursor');
        const page = await env.RECOVERY.list({
          limit: 1000,
          include: ['customMetadata'],
          ...(cursor ? { cursor } : {}),
        });
        return Response.json({
          success: true,
          result: page.objects.map((o) => ({
            key: o.key,
            size: o.size,
            last_modified: o.uploaded.toISOString(),
            custom_metadata: o.customMetadata,
          })),
          result_info: {
            is_truncated: page.truncated,
            ...(page.truncated ? { cursor: page.cursor } : {}),
          },
        });
      }
    }
    if (request.method === 'POST' && url.pathname === '/empty') {
      for (const bucket of [env.MEDIA, env.RECOVERY]) {
        const page = await bucket.list();
        if (page.truncated) throw new Error('Unexpected rehearsal volume.');
        if (page.objects.length) await bucket.delete(page.objects.map((o) => o.key));
        if ((await bucket.list()).objects.length) throw new Error('Rehearsal bucket not empty.');
      }
      return Response.json({ ok: true, emptied: 2 });
    }
    if (
      request.method !== 'POST' ||
      !/^\/(seed|backup|delete|restore|unsafe|retention|retry|healthy|cron-on|cron-off|stale|recover-monitor|provider-delete|provider-reconcile|checklist-proof)$/.test(
        url.pathname,
      )
    )
      return new Response(null, { status: 404 });
    return env.TARGET.fetch(
      new Request(`https://recovery.invalid${url.pathname}`, { method: 'POST' }),
    );
  },
};
