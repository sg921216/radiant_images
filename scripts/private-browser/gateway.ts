export const webOrigin = 'http://127.0.0.1:4273';
export const apiOrigin = 'http://127.0.0.1:8793';

export async function gateway(
  request: Request,
  origin: string,
  upstream: (request: Request) => Promise<Response>,
) {
  const url = new URL(request.url);
  const host = request.headers.get('Host');
  const source = request.headers.get('Origin');
  const navigation =
    (origin === webOrigin || (origin === apiOrigin && url.pathname === '/auth/google/callback')) &&
    request.method === 'GET' &&
    request.headers.get('Sec-Fetch-Mode') === 'navigate' &&
    request.headers.get('Sec-Fetch-Dest') === 'document';
  if (
    ![webOrigin, apiOrigin].includes(origin) ||
    url.origin !== origin ||
    (host !== null && host !== new URL(origin).host) ||
    (source !== null && source !== webOrigin) ||
    (!['GET', 'HEAD'].includes(request.method) && source !== webOrigin) ||
    (request.headers.get('Sec-Fetch-Site') === 'cross-site' && !navigation)
  ) {
    return new Response('Private browser access only', {
      status: 403,
      headers: {
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      },
    });
  }
  // Preserve application authentication, CORS, cookies and uncertain-send responses.
  // Never log URLs/bodies, follow redirects, add credentials or retry a request.
  return upstream(request);
}
