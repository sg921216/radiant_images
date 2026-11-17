import { env } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { beforeEach, expect, test, vi } from 'vitest';
import { createApp } from '../src';
import { seedLocalDatabase } from '../src/db/seedData';
import { ownerHeaders } from './helpers/owner';
import { contract } from './helpers/app';
import { assertContract } from './helpers/contracts';

const now = () => new Date('2026-11-13T12:00:00Z');
beforeEach(() => seedLocalDatabase(env.DB, true));

test.each([
  ['/public/bootstrap', 'public'],
  ['/admin/gallery', 'gallery'],
  ['/admin/clients?q=Synthetic', 'clients'],
])('the front Worker delegates %s while preserving the streamed response', async (path, key) => {
  const forward = vi.fn(
    async (_request: Request) =>
      new Response('synthetic streamed result', {
        headers: { 'X-Bulk-Read': 'delegated', 'Cache-Control': 'no-store' },
      }),
  );
  const getByName = vi.fn(() => ({ fetch: forward }));
  const namespace = new Proxy(env.BULK_READS, {
    get(target, property) {
      return property === 'getByName' ? getByName : Reflect.get(target, property);
    },
  });
  const app = createApp({ now, fetch }, true);
  const response = await app.request(
    path,
    { headers: await ownerHeaders(env, now()) },
    {
      ...env,
      BULK_READS: namespace,
    },
  );
  expect(response.headers.get('X-Bulk-Read')).toBe('delegated');
  expect(await response.text()).toBe('synthetic streamed result');
  expect(getByName).toHaveBeenCalledWith(key);
  expect(new URL(forward.mock.calls[0]![0]!.url).pathname).toBe(path!.split('?')[0]);
  expect(new URL(forward.mock.calls[0]![0]!.url).search).toBe(
    path!.includes('?') ? '?q=Synthetic' : '',
  );
});

test('missing owner access and restore mode stop reads before delegation', async () => {
  const getByName = vi.fn();
  const namespace = new Proxy(env.BULK_READS, {
    get(target, property) {
      return property === 'getByName' ? getByName : Reflect.get(target, property);
    },
  });
  const target = { ...env, BULK_READS: namespace };
  const app = createApp({ now, fetch }, true);
  expect((await app.request('/admin/clients', {}, target)).status).toBe(401);
  await env.DB.prepare('UPDATE lifecycle_state SET restore_status=1 WHERE id=1').run();
  expect((await app.request('/public/bootstrap', {}, target)).status).toBe(503);
  expect(getByName).not.toHaveBeenCalled();
});

test('the real read object rechecks auth/restore state and returns fresh contract-valid data', async () => {
  const stub = env.BULK_READS.getByName('real-read-checks');
  const read = async (path: string, headers?: HeadersInit) => {
    const response = await stub.fetch('https://api.rehearsal.invalid' + path, {
      headers: headers ?? {},
    });
    await assertContract(contract, path, 'get', response);
    return response;
  };
  expect((await read('/admin/gallery')).status).toBe(401);
  const headers = await ownerHeaders(env, new Date());
  expect(await (await read('/admin/gallery', headers)).json()).toEqual([]);
  expect(await (await read('/admin/clients', headers)).json()).toEqual([]);
  const first = await (
    await read('/public/bootstrap')
  ).json<{ config: { publicContactEmail: string } }>();
  expect(first.config.publicContactEmail).toBe('hello@example.invalid');
  await env.DB.prepare(
    "UPDATE site_config SET public_contact_email='fresh@example.invalid' WHERE id=1",
  ).run();
  const next = await (
    await read('/public/bootstrap')
  ).json<{ config: { publicContactEmail: string } }>();
  expect(next.config.publicContactEmail).toBe('fresh@example.invalid');
  await env.DB.prepare("UPDATE sessions SET owner_email='removed@example.invalid'").run();
  expect((await read('/admin/clients', headers)).status).toBe(403);
  const head = await stub.fetch('https://api.rehearsal.invalid/public/bootstrap', {
    method: 'HEAD',
  });
  expect(head.status).toBe(200);
  expect(await head.text()).toBe('');
  expect(
    (await stub.fetch('https://api.rehearsal.invalid/admin/gallery', { method: 'POST' })).status,
  ).toBe(404);
  expect((await stub.fetch('https://api.rehearsal.invalid/pricing')).status).toBe(404);
  await env.DB.prepare('UPDATE lifecycle_state SET restore_status=1 WHERE id=1').run();
  expect((await read('/public/bootstrap')).status).toBe(503);
});

test('eight in-flight reads allow the five-request profile, reject excess work, and recover after failures', async () => {
  await runInDurableObject(env.BULK_READS.getByName('admission-check'), async (instance) => {
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    Reflect.set(instance, 'execute', async () => {
      await barrier;
      throw new Error('synthetic_read_failure');
    });
    const request = () => new Request('https://api.rehearsal.invalid/public/bootstrap');
    const pending = Promise.allSettled(Array.from({ length: 8 }, () => instance.fetch(request())));
    const busy = await instance.fetch(request());
    expect(busy.status).toBe(503);
    expect(busy.headers.get('Retry-After')).toBe('2');
    await assertContract(contract, '/public/bootstrap', 'get', busy);
    release();
    expect((await pending).every((result) => result.status === 'rejected')).toBe(true);
    Reflect.set(instance, 'execute', async () => new Response('recovered'));
    expect(await (await instance.fetch(request())).text()).toBe('recovered');
  });
});
