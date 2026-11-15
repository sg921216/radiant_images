import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import { contract, createApp } from './helpers/app';
import { ownerHeaders } from './helpers/owner';
import { seedLocalDatabase } from '../src/db/seedData';
const now = new Date('2026-11-13T12:00:00Z');
const run = { now: () => now, fetch: async () => new Response('', { status: 503 }) };
const protectedOperations = Object.entries(contract.paths).flatMap(([path, item]) =>
  Object.entries(item)
    .filter(([, op]) => Boolean((op as { security?: unknown[] })?.security?.length))
    .map(([method]) => ({ method, path })),
);
test.each(protectedOperations)(
  '$method $path rejects missing, expired, non-owner and removed owner sessions',
  async ({ method, path }) => {
    await seedLocalDatabase(env.DB, true);
    const target = path
      .replaceAll('{id}', '01K00000000000000000000001')
      .replaceAll('{itemId}', '01K00000000000000000000002')
      .replaceAll('{page}', 'about');
    const app = createApp(run);
    expect((await app.request(target, { method }, env)).status).toBe(401);
    let headers = await ownerHeaders(env, new Date(now.getTime() - 86400000));
    expect((await app.request(target, { method, headers }, env)).status).toBe(401);
    headers = await ownerHeaders(env);
    await env.DB.prepare("UPDATE sessions SET owner_email='visitor@example.invalid'").run();
    expect((await app.request(target, { method, headers }, env)).status).toBe(403);
    headers = await ownerHeaders(env);
    expect(
      (
        await app.request(
          target,
          { method, headers },
          { ...env, OWNER_ALLOWLIST: 'different@example.invalid' },
        )
      ).status,
    ).toBe(403);
  },
);
test('read operations fail closed during recovery and no recovery paths are publicly addressable', async () => {
  await seedLocalDatabase(env.DB, true);
  const app = createApp(run);
  for (const path of [
    '/backups/private.json',
    '/client-deletions/private.json',
    '/media-recovery/private',
    '/health/latest.json',
  ])
    expect((await app.request(path, {}, env)).status).toBe(404);
  await env.DB.prepare('UPDATE lifecycle_state SET restore_status=1').run();
  for (const path of [
    '/public/bootstrap',
    '/pricing',
    '/admin/clients',
    '/questionnaire/' + 'a'.repeat(43),
  ])
    expect((await app.request(path, {}, env)).status).toBe(503);
});
