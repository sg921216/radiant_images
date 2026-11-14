import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import { createApp } from '../src/index';
import { ownerHeaders } from './helpers/owner';

test('front Worker authenticates before forwarding a streaming gallery mutation', async () => {
  const app = createApp(undefined, true);
  expect(
    (await app.request('/admin/gallery', { method: 'POST', body: new FormData() }, env)).status,
  ).toBe(401);
  const headers = await ownerHeaders(env, new Date());
  let forwarded = false;
  const namespace = new Proxy(env.GALLERY_MUTATIONS, {
    get(target, key) {
      if (key === 'getByName')
        return () => ({
          fetch: async (request: Request) => {
            forwarded = true;
            expect(request.bodyUsed).toBe(false);
            return new Response(null, { status: 204 });
          },
        });
      return Reflect.get(target, key);
    },
  });
  const response = await app.request(
    '/admin/gallery',
    { method: 'POST', headers, body: 'synthetic-body' },
    { ...env, GALLERY_MUTATIONS: namespace },
  );
  expect(response.status).toBe(204);
  expect(forwarded).toBe(true);
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
});

test('gallery coordinator bounds concurrent mutations and still enforces owner authorization', async () => {
  const coordinator = env.GALLERY_MUTATIONS.getByName('synthetic-portfolio');
  expect(
    (
      await coordinator.fetch('https://api.rehearsal.invalid/admin/gallery', {
        method: 'POST',
        body: new FormData(),
      })
    ).status,
  ).toBe(401);
  let release!: () => void;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      release = () => controller.close();
    },
  });
  const pending = coordinator.fetch('https://api.rehearsal.invalid/admin/gallery', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'multipart/form-data; boundary=synthetic' },
  });
  const second = await coordinator.fetch('https://api.rehearsal.invalid/admin/gallery', {
    method: 'POST',
    body: new FormData(),
  });
  expect(second.status).toBe(429);
  expect(second.headers.get('Retry-After')).toBe('2');
  release();
  expect((await pending).status).toBe(401);
  expect(
    (
      await coordinator.fetch('https://api.rehearsal.invalid/admin/gallery', {
        method: 'POST',
        body: new FormData(),
      })
    ).status,
  ).toBe(401);
});
