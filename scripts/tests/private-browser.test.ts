import { expect, test, vi } from 'vitest';
import { apiOrigin, gateway, webOrigin } from '../private-browser/gateway';

test.each([
  new Request('http://rebound.example.test:8793/admin/config'),
  new Request(apiOrigin + '/admin/config', { headers: { Host: 'rebound.example.test' } }),
  new Request(apiOrigin + '/admin/config', {
    headers: { Origin: 'https://unrelated.example.test' },
  }),
  new Request(apiOrigin + '/inquiries', { method: 'POST' }),
  new Request(apiOrigin + '/auth/google/start', { headers: { 'Sec-Fetch-Site': 'cross-site' } }),
  new Request(apiOrigin + '/auth/google/callback', { headers: { 'Sec-Fetch-Site': 'cross-site' } }),
])(
  'denies a nonlocal host or untrusted browser request without calling the API %#',
  async (request) => {
    const upstream = vi.fn(async () => new Response('Sensitive fixture'));
    const response = await gateway(request, apiOrigin, upstream);
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  },
);

test('passes an authorized-origin request once without manufacturing an owner session or retrying', async () => {
  const request = new Request(apiOrigin + '/admin/config', {
    method: 'PUT',
    headers: {
      Origin: webOrigin,
      Authorization: 'Bearer synthetic-fixture',
      'Content-Type': 'application/json',
    },
    body: '{"fixture":true}',
  });
  const response = new Response('Unknown send outcome', { status: 504 });
  const upstream = vi.fn(async (forwarded: Request) => {
    expect(forwarded).toBe(request);
    expect(await forwarded.text()).toBe('{"fixture":true}');
    return response;
  });
  expect(await gateway(request, apiOrigin, upstream)).toBe(response);
  expect(upstream).toHaveBeenCalledTimes(1);
});

test('passes the Google callback only as a top-level GET navigation without consuming its redirect', async () => {
  const request = new Request(apiOrigin + '/auth/google/callback?state=synthetic&code=synthetic', {
    headers: {
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
    },
  });
  const response = new Response(null, {
    status: 302,
    headers: { Location: webOrigin + '/admin/callback#code=synthetic' },
  });
  const upstream = vi.fn(async () => response);
  expect(await gateway(request, apiOrigin, upstream)).toBe(response);
  expect(upstream).toHaveBeenCalledOnce();
});

test('serves a local web navigation and API preflight without bypassing API CORS', async () => {
  const upstream = vi.fn(async () => new Response(null, { status: 204 }));
  expect((await gateway(new Request(webOrigin + '/admin/login'), webOrigin, upstream)).status).toBe(
    204,
  );
  const preflight = new Request(apiOrigin + '/admin/config', {
    method: 'OPTIONS',
    headers: { Origin: webOrigin, 'Access-Control-Request-Method': 'PUT' },
  });
  const response = await gateway(preflight, apiOrigin, upstream);
  expect(response.status).toBe(204);
  expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
});

test.each(['/q/fixture', '/admin/callback'])(
  'allows top-level navigation to %s from mail or Google without allowing cross-site API reads',
  async (path) => {
    const headers = {
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
    };
    const upstream = vi.fn(async () => new Response('Application shell'));
    expect(
      (await gateway(new Request(webOrigin + path, { headers }), webOrigin, upstream)).status,
    ).toBe(200);
    expect(
      (await gateway(new Request(apiOrigin + '/admin/config', { headers }), apiOrigin, upstream))
        .status,
    ).toBe(403);
    expect(
      (
        await gateway(
          new Request(webOrigin + path, { headers: { ...headers, 'Sec-Fetch-Mode': 'cors' } }),
          webOrigin,
          upstream,
        )
      ).status,
    ).toBe(403);
    expect(upstream).toHaveBeenCalledOnce();
  },
);
