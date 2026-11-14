import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { createApp } from './helpers/app';
import { seedLocalDatabase } from '../src/db/seedData';
import { ownerHeaders } from './helpers/owner';
import type { PricingRevision, PublicBootstrap } from '@radiant/shared';
const now = () => new Date('2026-11-13T12:00:00.000Z');
beforeEach(() => seedLocalDatabase(env.DB, true));
const app = () => createApp({ now, fetch: async () => new Response('', { status: 503 }) });
const draft = (name: string) => ({
  packages: (['maternity', 'newborn', 'family'] as const).map((shootType) => ({
    id: 'ignored-client-id',
    shootType,
    sortOrder: 0,
    name: `${name} ${shootType}`,
    priceCents: 32500,
    description: 'Synthetic package',
    inclusions: ['A planning conversation'],
  })),
});
test('publication creates immutable rows and shares one consistent revision with bootstrap and admin', async () => {
  const headers = await ownerHeaders(env);
  const response = await app().request(
    '/admin/pricing',
    { method: 'PUT', headers, body: JSON.stringify(draft('New')) },
    env,
  );
  expect(response.status).toBe(200);
  const saved = (await response.json()) as PricingRevision;
  expect(saved.packages).toHaveLength(3);
  expect(new Set(saved.packages.map((p) => p.id)).size).toBe(3);
  expect(saved.packages.some((p) => p.id === 'ignored-client-id')).toBe(false);
  const publicResponse = await app().request('/pricing', {}, env);
  expect(publicResponse.status).toBe(200);
  expect(await publicResponse.json()).toEqual(saved);
  expect(
    ((await (await app().request('/public/bootstrap', {}, env)).json()) as PublicBootstrap).pricing,
  ).toEqual(saved);
  expect(await (await app().request('/admin/pricing', { headers }, env)).json()).toEqual(saved);
  expect((await env.DB.prepare('SELECT * FROM pricing_revisions').all()).results).toHaveLength(2);
});
test('missing shoot type, negative price and duplicate sort order are rejected without changing publication', async () => {
  const headers = await ownerHeaders(env);
  const before = await env.DB.prepare('SELECT * FROM pricing_publication').first();
  for (const packages of [
    draft('Missing').packages.slice(1),
    draft('Invalid').packages.map((p) => ({ ...p, priceCents: -1 })),
    [...draft('Duplicate').packages, draft('Duplicate').packages[0]],
  ])
    expect(
      (
        await app().request(
          '/admin/pricing',
          { method: 'PUT', headers, body: JSON.stringify({ packages }) },
          env,
        )
      ).status,
    ).toBe(400);
  expect(await env.DB.prepare('SELECT * FROM pricing_publication').first()).toEqual(before);
});
test('simultaneous equal-time publications select the last committed complete revision', async () => {
  const headers = await ownerHeaders(env);
  const instance = app();
  const responses = await Promise.all(
    ['First', 'Second'].map((name) =>
      instance.request(
        '/admin/pricing',
        { method: 'PUT', headers, body: JSON.stringify(draft(name)) },
        env,
      ),
    ),
  );
  expect(responses.map((r) => r.status)).toEqual([200, 200]);
  const saved = await Promise.all(responses.map((r) => r.json() as Promise<PricingRevision>));
  expect(new Set(saved.map((r) => r.publishedAt)).size).toBe(1);
  const last = await env.DB.prepare(
    'SELECT id FROM pricing_revisions ORDER BY rowid DESC LIMIT 1',
  ).first<{ id: string }>();
  const current = (await (await instance.request('/pricing', {}, env)).json()) as PricingRevision;
  expect(current.revisionId).toBe(last?.id);
  expect(current).toEqual(saved.find((r) => r.revisionId === last?.id));
  expect((await env.DB.prepare('SELECT * FROM pricing_publication').all()).results).toHaveLength(1);
});
test('pointer update failure rolls back the revision and every package', async () => {
  const headers = await ownerHeaders(env);
  const before = await env.DB.prepare('SELECT * FROM pricing_publication').first();
  await env.DB.exec(
    "CREATE TRIGGER fail_publication BEFORE UPDATE ON pricing_publication BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;",
  );
  expect(
    (
      await app().request(
        '/admin/pricing',
        { method: 'PUT', headers, body: JSON.stringify(draft('Failure')) },
        env,
      )
    ).status,
  ).toBe(500);
  expect(await env.DB.prepare('SELECT * FROM pricing_publication').first()).toEqual(before);
  expect((await env.DB.prepare('SELECT * FROM pricing_revisions').all()).results).toHaveLength(1);
  expect((await env.DB.prepare('SELECT * FROM pricing_packages').all()).results).toHaveLength(3);
});
