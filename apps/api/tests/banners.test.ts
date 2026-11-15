import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { createApp } from './helpers/app';
import { ownerHeaders } from './helpers/owner';
import { seedLocalDatabase } from '../src/db/seedData';
let clock = '2026-11-13T12:00:00.000Z';
const app = () =>
  createApp({ now: () => new Date(clock), fetch: async () => new Response('', { status: 503 }) });
let headers: Record<string, string>;
beforeEach(async () => {
  clock = '2026-11-13T12:00:00.000Z';
  await seedLocalDatabase(env.DB, true);
  headers = await ownerHeaders(env);
});
const draft = {
  message: 'A synthetic promotion',
  linkUrl: 'https://example.invalid/session',
  startsAt: '2026-11-13T07:00:00-05:00',
  endsAt: '2026-11-13T08:00:00-05:00',
};
const save = (body: unknown = draft) =>
  app().request('/admin/banners', { method: 'POST', headers, body: JSON.stringify(body) }, env);
async function banner() {
  return (
    (await (await app().request('/public/bootstrap', {}, env)).json()) as {
      banner: { id: string; message: string } | null;
    }
  ).banner;
}
test('banner CRUD normalizes offsets, selects exact inclusive/exclusive boundaries and leaves no inactive banner', async () => {
  const created = await save();
  expect(created.status).toBe(201);
  const value = (await created.json()) as { id: string; startsAt: string };
  expect(value.startsAt).toBe('2026-11-13T12:00:00.000Z');
  clock = '2026-11-13T11:59:59.999Z';
  expect(await banner()).toBeNull();
  clock = '2026-11-13T12:00:00.000Z';
  expect(await banner()).toMatchObject({ id: value.id });
  clock = '2026-11-13T13:00:00.000Z';
  expect(await banner()).toBeNull();
  const edited = await app().request(
    `/admin/banners/${value.id}`,
    { method: 'PUT', headers, body: JSON.stringify({ ...draft, message: 'Updated promotion' }) },
    env,
  );
  expect(edited.status).toBe(200);
  clock = '2026-11-13T12:00:00.000Z';
  expect(await banner()).toMatchObject({ message: 'Updated promotion' });
  expect(
    (await app().request(`/admin/banners/${value.id}`, { method: 'DELETE', headers }, env)).status,
  ).toBe(204);
  expect(await banner()).toBeNull();
});
test('overlaps use latest start then latest creation; deleting the winner reveals the remaining active banner', async () => {
  const first = await save();
  expect(first.status).toBe(201);
  clock = '2026-11-13T12:10:00.000Z';
  const second = await save({ ...draft, message: 'Second', startsAt: '2026-11-13T12:05:00Z' });
  expect(second.status).toBe(201);
  const secondId = ((await second.json()) as { id: string }).id;
  clock = '2026-11-13T12:11:00.000Z';
  const third = await save({ ...draft, message: 'Third', startsAt: '2026-11-13T12:05:00Z' });
  expect(third.status).toBe(201);
  const thirdId = ((await third.json()) as { id: string }).id;
  expect(await banner()).toMatchObject({ id: thirdId });
  await app().request(`/admin/banners/${thirdId}`, { method: 'DELETE', headers }, env);
  expect(await banner()).toMatchObject({ id: secondId });
});
test('invalid windows, unsafe links, empty/oversized messages and failed atomic saves preserve publication', async () => {
  const response = await save();
  expect(response.status).toBe(201);
  const original = (await response.json()) as { id: string };
  for (const change of [
    { message: ' ' },
    { message: 'x'.repeat(201) },
    { linkUrl: 'javascript:alert(1)' },
    { linkUrl: 'http://example.invalid' },
    { endsAt: draft.startsAt },
    { startsAt: '2026-11-13T07:00' },
    { endsAt: '2026-02-30T12:00:00Z' },
  ]) {
    expect(
      (
        await app().request(
          `/admin/banners/${original.id}`,
          { method: 'PUT', headers, body: JSON.stringify({ ...draft, ...change }) },
          env,
        )
      ).status,
    ).toBe(400);
  }
  expect(await banner()).toMatchObject({ message: draft.message });
  await env.DB.exec(
    "CREATE TRIGGER fail_banner_audit BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'synthetic audit failure'); END;",
  );
  expect(
    (
      await app().request(
        `/admin/banners/${original.id}`,
        { method: 'PUT', headers, body: JSON.stringify({ ...draft, message: 'Should roll back' }) },
        env,
      )
    ).status,
  ).toBe(500);
  expect(await banner()).toMatchObject({ message: draft.message });
});
test('every banner operation denies missing, expired and removed-owner sessions', async () => {
  for (const [path, method] of [
    ['/admin/banners', 'GET'],
    ['/admin/banners', 'POST'],
    ['/admin/banners/01K00000000000000000000001', 'PUT'],
    ['/admin/banners/01K00000000000000000000001', 'DELETE'],
  ]) {
    expect(
      (
        await app().request(
          path!,
          { method: method!, ...(method === 'POST' || method === 'PUT' ? { body: '{}' } : {}) },
          env,
        )
      ).status,
    ).toBe(401);
    headers = await ownerHeaders(env);
    expect(
      (
        await app().request(
          path!,
          { method: method!, headers },
          { ...env, OWNER_ALLOWLIST: 'removed@example.invalid' },
        )
      ).status,
    ).toBe(403);
    headers = await ownerHeaders(env, new Date('2026-11-01T12:00:00Z'));
    expect((await app().request(path!, { method: method!, headers }, env)).status).toBe(401);
  }
});
