import { env } from 'cloudflare:workers';
import { beforeEach, expect, test, vi } from 'vitest';
import { createApp } from './helpers/app';
import { ownerHeaders } from './helpers/owner';
import type { Env } from '../src/env';
import type { Runtime } from '../src/services/runtime';
import { productionRuntime } from '../src/services/runtime';
import type { GalleryImage } from '@radiant/shared';
import fixtures from '../../../e2e/fixtures/images/fixtures.json';
const decode = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const now = () => new Date('2026-11-13T12:00:00.000Z');
let authorization: string;
beforeEach(async () => {
  authorization = (await ownerHeaders(env)).Authorization;
});
function form(alt = 'A synthetic family portrait', changes: Record<string, string | Blob> = {}) {
  const f = new FormData();
  for (const [key, value] of Object.entries({
    tag: 'family',
    altText: alt,
    width: '60',
    height: '40',
    originalMime: 'image/png',
    originalBytes: String(decode(fixtures.original).length),
  }))
    f.set(key, value);
  f.set('original', new File([decode(fixtures.original)], 'fixture.png', { type: 'image/png' }));
  for (const variant of ['full', 'card', 'thumb'])
    f.set(variant, new File([decode(fixtures.webp)], `${variant}.webp`, { type: 'image/webp' }));
  for (const [key, value] of Object.entries(changes)) f.set(key, value);
  return f;
}
const runtime = (): Runtime => ({
  now,
  fetch: async () => new Response('', { status: 503 }),
  validateImages: async () => ({
    original: { mime: 'image/png', width: 60, height: 40 },
    full: { width: 60, height: 40, bytes: decode(fixtures.webp) },
    card: { width: 60, height: 40, bytes: decode(fixtures.webp) },
    thumb: { width: 60, height: 40, bytes: decode(fixtures.webp) },
  }),
});
const upload = (body = form(), bindings: Env = env, run = runtime()) =>
  createApp(run).request(
    '/admin/gallery',
    { method: 'POST', headers: { Authorization: authorization }, body },
    bindings,
  );
test('upload publishes only after four private writes and exposes descriptive ordered variants', async () => {
  const response = await upload(form('  A synthetic family portrait  '));
  expect(response.status).toBe(201);
  const image = (await response.json()) as GalleryImage;
  expect(image.altText).toBe('A synthetic family portrait');
  expect(image.width).toBe(60);
  expect((await env.MEDIA.list()).objects).toHaveLength(4);
  expect(await env.MEDIA.get(`originals/${image.id}/source`)).not.toBeNull();
  expect((await createApp().request(`/images/${image.id}/full`, {}, env)).status).toBe(200);
  expect((await createApp().request(`/images/${image.id}/original`, {}, env)).status).toBe(400);
  expect(
    await (
      await createApp(runtime()).request(
        '/admin/gallery',
        { headers: { Authorization: authorization } },
        env,
      )
    ).json(),
  ).toEqual([image]);
});

test('upload refuses combined storage pressure before image processing and resumes after cleanup', async () => {
  const run = runtime();
  const validateImages = vi.fn(run.validateImages!);
  let recoveryBytes = 5.5 * 1024 ** 3;
  const list = vi.fn(async (options?: R2ListOptions) => ({
    objects: [{ size: options?.cursor ? recoveryBytes : 0.5 * 1024 ** 3 }],
    truncated: !options?.cursor,
    ...(options?.cursor ? {} : { cursor: 'second-page' }),
  }));
  const recovery = new Proxy(env.RECOVERY, {
    get: (target, key) =>
      key === 'list'
        ? list
        : typeof Reflect.get(target, key) === 'function'
          ? Reflect.get(target, key).bind(target)
          : Reflect.get(target, key),
  });
  const response = await upload(form(), { ...env, RECOVERY: recovery }, { ...run, validateImages });
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ error: { code: 'storage_capacity_unavailable' } });
  expect(validateImages).not.toHaveBeenCalled();
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
  expect(list).toHaveBeenCalledWith(expect.objectContaining({ cursor: 'second-page' }));
  recoveryBytes = 0;
  const resumed = await upload(form(), { ...env, RECOVERY: recovery }, { ...run, validateImages });
  expect(resumed.status).toBe(201);
  expect(validateImages).toHaveBeenCalledOnce();
  const image = (await resumed.json()) as GalleryImage;
  recoveryBytes = 5.5 * 1024 ** 3;
  expect((await createApp().request(`/images/${image.id}/full`, {}, env)).status).toBe(200);
  const removed = await createApp(run).request(
    `/admin/gallery/${image.id}`,
    { method: 'DELETE', headers: { Authorization: authorization } },
    { ...env, RECOVERY: recovery },
  );
  expect(removed.status).toBe(204);
});

test('upload refuses unmeasurable storage without calling the image provider', async () => {
  const validateImages = vi.fn(runtime().validateImages!);
  const media = new Proxy(env.MEDIA, {
    get: (target, key) =>
      key === 'list'
        ? async () => {
            throw new Error('synthetic_list_failure');
          }
        : typeof Reflect.get(target, key) === 'function'
          ? Reflect.get(target, key).bind(target)
          : Reflect.get(target, key),
  });
  const response = await upload(form(), { ...env, MEDIA: media }, { ...runtime(), validateImages });
  expect(response.status).toBe(503);
  expect(validateImages).not.toHaveBeenCalled();
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});
test('missing/blank/long alt, mismatched MIME/size/dimensions, forged and metadata-bearing variants cannot publish', async () => {
  for (const alt of ['', '   ', 'x'.repeat(201)])
    expect((await upload(form(alt))).status).toBe(400);
  for (const changes of [
    { originalMime: 'image/jpeg' },
    { originalBytes: '2' },
    { width: '61' },
    { full: new Blob(['not a webp'], { type: 'image/webp' }) },
    { full: new Blob([decode(fixtures.metadata)], { type: 'image/webp' }) },
  ])
    expect((await upload(form('Synthetic fixture', changes))).status).toBe(400);
  expect((await env.DB.prepare('SELECT * FROM gallery_images').all()).results).toHaveLength(0);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});
test('production without authoritative image validation fails closed', async () => {
  expect((await upload(form(), env, { now, fetch: runtime().fetch })).status).toBe(500);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});

test('production upload rejects damaged JPEGs with re-export guidance before storage or transformation', async () => {
  const input = vi.fn();
  const images = new Proxy(env.IMAGES, {
    get(target, key) {
      return key === 'input' ? input : Reflect.get(target, key);
    },
  });
  const truncated = decode(fixtures.oriented).slice(0, -20);
  for (const bytes of [truncated, Uint8Array.from([...truncated, 255, 217])]) {
    const response = await upload(
      form('Synthetic damaged photo', {
        original: new Blob([bytes], { type: 'image/jpeg' }),
        originalMime: 'image/jpeg',
        originalBytes: String(bytes.length),
      }),
      { ...env, IMAGES: images },
      { ...productionRuntime, now },
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Re-export');
  }
  expect(input).not.toHaveBeenCalled();
  expect((await env.DB.prepare('SELECT id FROM gallery_images').all()).results).toHaveLength(0);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});

test('production upload publishes regenerated variants after authoritative validation', async () => {
  const encoded = decode(fixtures.webp);
  const input = vi.fn(() => {
    const chain: ImageTransformer = {
      transform: () => chain,
      draw: () => {
        throw new Error('Not used');
      },
      output: async () => ({
        contentType: () => 'image/webp',
        image: () => new Response(encoded).body!,
        response: () => new Response(encoded),
      }),
    };
    return chain;
  });
  const images = new Proxy(env.IMAGES, {
    get(target, key) {
      if (key === 'input') return input;
      if (key === 'info')
        return async () => ({
          format: 'image/png',
          width: 60,
          height: 40,
          fileSize: decode(fixtures.original).length,
        });
      return Reflect.get(target, key);
    },
  });
  const response = await upload(form(), { ...env, IMAGES: images }, { ...productionRuntime, now });
  expect(response.status).toBe(201);
  expect(input).toHaveBeenCalledTimes(6);
  expect((await env.MEDIA.list()).objects).toHaveLength(4);
});

test('production upload with missing bindings fails closed without storing the image', async () => {
  const missing = { ...env };
  Reflect.deleteProperty(missing, 'IMAGES');
  expect((await upload(form(), missing, { ...productionRuntime, now })).status).toBe(500);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});

test('missing alt and unauthorized gallery operations cannot change publication', async () => {
  const missing = form();
  missing.delete('altText');
  expect((await upload(missing)).status).toBe(400);
  for (const [path, method] of [
    ['/admin/gallery', 'GET'],
    ['/admin/gallery', 'POST'],
    ['/admin/gallery/order', 'PUT'],
    ['/admin/gallery/01K00000000000000000000001', 'PATCH'],
    ['/admin/gallery/01K00000000000000000000001', 'DELETE'],
  ]) {
    expect((await createApp(runtime()).request(path!, { method: method! }, env)).status).toBe(401);
    authorization = (await ownerHeaders(env)).Authorization;
    expect(
      (
        await createApp(runtime()).request(
          path!,
          { method: method!, headers: { Authorization: authorization } },
          { ...env, OWNER_ALLOWLIST: 'removed@example.invalid' },
        )
      ).status,
    ).toBe(403);
    const expired = await ownerHeaders(env, new Date('2026-11-01T12:00:00Z'));
    expect(
      (await createApp(runtime()).request(path!, { method: method!, headers: expired }, env))
        .status,
    ).toBe(401);
  }
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});
test('database failure after object deletion restores all published image bytes', async () => {
  const image = (await (await upload()).json()) as GalleryImage;
  await env.DB.exec(
    "CREATE TRIGGER fail_gallery_delete BEFORE DELETE ON gallery_images BEGIN SELECT RAISE(ABORT,'synthetic deletion failure'); END;",
  );
  expect(
    (
      await createApp(runtime()).request(
        `/admin/gallery/${image.id}`,
        { method: 'DELETE', headers: { Authorization: authorization } },
        env,
      )
    ).status,
  ).toBe(500);
  expect((await env.MEDIA.list()).objects).toHaveLength(4);
  expect((await createApp(runtime()).request(`/images/${image.id}/full`, {}, env)).status).toBe(
    200,
  );
  expect((await env.DB.prepare('SELECT id FROM gallery_images').all()).results).toHaveLength(1);
});
test('partial R2 write failure cleans staged objects without publishing', async () => {
  let count = 0;
  const media = new Proxy(env.MEDIA, {
    get(target, key) {
      if (key === 'put')
        return (...args: Parameters<R2Bucket['put']>) => {
          if (++count === 3) throw new Error('synthetic R2 outage');
          return target.put(...args);
        };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  expect((await upload(form(), { ...env, MEDIA: media })).status).toBe(500);
  expect((await env.DB.prepare('SELECT * FROM gallery_images').all()).results).toHaveLength(0);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});
test('concurrent upload cannot exceed sixty images', async () => {
  await env.DB.batch(
    Array.from({ length: 59 }, (_, index) =>
      env.DB.prepare(
        "INSERT INTO gallery_images (id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height) VALUES (?,'family','Synthetic fixture',?,60,40,'image/png',100,60,40)",
      ).bind(`01TEST00000000000000${String(index).padStart(6, '0')}`, index),
    ),
  );
  const responses = await Promise.all([upload(), upload()]);
  expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  expect(
    (
      await env.DB.prepare('SELECT COUNT(*) AS count FROM gallery_images').first<{
        count: number;
      }>()
    )?.count,
  ).toBe(60);
  expect((await env.MEDIA.list()).objects).toHaveLength(4);
});
test('tag-only edits preserve alt, complete reorder is atomic, and invalid edits leave publication unchanged', async () => {
  const first = (await (await upload()).json()) as GalleryImage;
  const second = (await (await upload(form('Second synthetic portrait'))).json()) as GalleryImage;
  const headers = { Authorization: authorization, 'Content-Type': 'application/json' };
  const app = createApp(runtime());
  const patch = await app.request(
    `/admin/gallery/${first.id}`,
    { method: 'PATCH', headers, body: JSON.stringify({ tag: 'newborn' }) },
    env,
  );
  expect(patch.status).toBe(200);
  expect(((await patch.json()) as GalleryImage).altText).toBe(first.altText);
  for (const altText of ['', '  ', 'x'.repeat(201)])
    expect(
      (
        await app.request(
          `/admin/gallery/${first.id}`,
          { method: 'PATCH', headers, body: JSON.stringify({ altText }) },
          env,
        )
      ).status,
    ).toBe(400);
  expect(
    (
      await app.request(
        '/admin/gallery/order',
        { method: 'PUT', headers, body: JSON.stringify({ ids: [second.id, first.id] }) },
        env,
      )
    ).status,
  ).toBe(204);
  expect(
    ((await (await app.request('/admin/gallery', { headers }, env)).json()) as GalleryImage[]).map(
      (i) => i.id,
    ),
  ).toEqual([second.id, first.id]);
  expect(
    (
      await app.request(
        '/admin/gallery/order',
        { method: 'PUT', headers, body: JSON.stringify({ ids: [first.id] }) },
        env,
      )
    ).status,
  ).toBe(400);
});
test('deletion failure preserves publication; success removes metadata and objects', async () => {
  const image = (await (await upload()).json()) as GalleryImage;
  const failed = new Proxy(env.MEDIA, {
    get(target, key) {
      if (key === 'delete')
        return () => {
          throw new Error('synthetic deletion failure');
        };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const app = createApp(runtime());
  expect(
    (
      await app.request(
        `/admin/gallery/${image.id}`,
        { method: 'DELETE', headers: { Authorization: authorization } },
        { ...env, MEDIA: failed },
      )
    ).status,
  ).toBe(500);
  expect((await app.request(`/images/${image.id}/full`, {}, env)).status).toBe(200);
  expect(
    (
      await app.request(
        `/admin/gallery/${image.id}`,
        { method: 'DELETE', headers: { Authorization: authorization } },
        env,
      )
    ).status,
  ).toBe(204);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
  expect((await app.request(`/images/${image.id}/full`, {}, env)).status).toBe(404);
});
