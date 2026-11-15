import { expect, test } from 'vitest';
import worker from '../../apps/web/worker';

test.each([
  { path: '/admin/callback', method: 'POST', status: 405 },
  { path: '/admin', method: 'GET', status: 503 },
  { path: '/missing.js', method: 'GET', status: 404 },
])(
  'generated $status responses retain privacy and script restrictions',
  async ({ path, method, status }) => {
    const response = await worker.fetch(
      new Request('https://web.example.invalid' + path, { method }),
      {
        ASSETS: {
          fetch: async (request) =>
            new URL(request.url).pathname === '/security-policy.json'
              ? new Response(null, { status: 404 })
              : new Response('<html>Fallback</html>'),
        },
      },
    );
    expect(response.status).toBe(status);
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  },
);
