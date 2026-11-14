function failure(message: string, status: number, extra: Record<string, string> = {}) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Strict-Transport-Security': 'max-age=31536000',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      ...extra,
    },
  });
}
export default {
  async fetch(
    request: Request,
    env: { ASSETS: { fetch: (request: Request) => Promise<Response> } },
  ) {
    const url = new URL(request.url);
    const privateRoute = /^\/(?:admin(?:\/|$)|q\/)/.test(url.pathname);
    if (!['GET', 'HEAD'].includes(request.method))
      return failure('Method not allowed', 405, { Allow: 'GET, HEAD' });
    if (privateRoute) {
      // Static Assets canonicalizes .html paths; the extensionless asset resolves the generated file.
      const fallback = new URL('/__spa-fallback', url.origin);
      const asset = await env.ASSETS.fetch(new Request(fallback, { method: request.method }));
      const headers = new Headers(asset.headers);
      const policy = await env.ASSETS.fetch(
        new Request(new URL('/security-policy.json', url.origin)),
      );
      if (!policy.ok) return failure('Temporarily unavailable', 503);
      const security = (await policy.json()) as Record<string, string>;
      for (const [key, value] of Object.entries(security)) headers.set(key, value);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      headers.set('Referrer-Policy', 'no-referrer');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(asset.body, { status: asset.status, headers });
    }
    return failure('Not found', 404);
  },
};
