import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { seedLocalDatabase } from '../src/db/seedData';
import { runScheduled } from '../src/scheduled';

const now = new Date('2026-11-14T12:00:00Z');
const runtime = { now: () => now, fetch: async () => new Response('', { status: 503 }) };
beforeEach(() => seedLocalDatabase(env.DB, true));

test('scheduled maintenance and verified backup publish separate private status records', async () => {
  await runScheduled('0 3 * * *', env, runtime);
  for (const name of ['maintenance', 'backup']) {
    const saved = await env.RECOVERY.get(`operations/${name}.json`);
    expect(saved).not.toBeNull();
    expect(await saved!.json()).toEqual({
      version: 1,
      status: 'ok',
      startedAt: now.toISOString(),
      finishedAt: now.toISOString(),
    });
  }
  expect((await env.RECOVERY.list({ prefix: 'backups/' })).objects).toHaveLength(1);
});

test('failed cleanup replaces a previously healthy status and the next scheduled run recovers', async () => {
  await runScheduled('*/5 * * * *', env, runtime);
  await env.RECOVERY.put('backups/synthetic-invalid.json', 'synthetic');
  await expect(runScheduled('*/5 * * * *', env, runtime)).rejects.toThrow('maintenance_failed');
  const failed = await (await env.RECOVERY.get('operations/maintenance.json'))!.json();
  expect(failed).toMatchObject({ version: 1, status: 'error', finishedAt: now.toISOString() });
  expect(JSON.stringify(failed)).not.toContain('synthetic-invalid');
  await env.RECOVERY.delete('backups/synthetic-invalid.json');
  await runScheduled('*/5 * * * *', env, runtime);
  expect(await (await env.RECOVERY.get('operations/maintenance.json'))!.json()).toMatchObject({
    status: 'ok',
  });
});
