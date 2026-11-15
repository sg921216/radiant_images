import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { seedLocalDatabase } from '../src/db/seedData';
import { runScheduled } from '../src/scheduled';
import type { Env } from '../src/env';

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

test('a new run retains the previous successful completion while work is in progress', async () => {
  await runScheduled('0 3 * * *', env, runtime);
  const running: unknown[] = [];
  const recovery = new Proxy(env.RECOVERY, {
    get(target, key) {
      if (key === 'put')
        return async (...args: Parameters<R2Bucket['put']>) => {
          if (args[0].startsWith('operations/') && typeof args[1] === 'string') {
            const value = JSON.parse(args[1]);
            if (value.status === 'running') running.push(value);
          }
          return target.put(...args);
        };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const next = new Date(now.getTime() + 300_000);
  await runScheduled('0 3 * * *', { ...env, RECOVERY: recovery } as Env, {
    ...runtime,
    now: () => next,
  });
  expect(running).toHaveLength(2);
  for (const record of running)
    expect(record).toMatchObject({
      status: 'running',
      startedAt: next.toISOString(),
      lastSucceededAt: now.toISOString(),
    });
});
