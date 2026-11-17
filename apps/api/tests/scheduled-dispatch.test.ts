import { env } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { beforeEach, expect, test, vi } from 'vitest';
import { scheduled } from '../src/scheduled';
import { seedLocalDatabase } from '../src/db/seedData';

beforeEach(() => seedLocalDatabase(env.DB, true));

const event = (cron: string) => ({ cron, scheduledTime: Date.now(), noRetry() {} });
const invoke = async (name: string, cron: string) => {
  await env.SCHEDULED_OPERATIONS.getByName(name).run(cron);
};

test('cron awaits the private coordinator without running storage work in the front Worker', async () => {
  const run = vi.fn(async () => undefined);
  const target = {
    ...env,
    SCHEDULED_OPERATIONS: new Proxy(env.SCHEDULED_OPERATIONS, {
      get(target, key) {
        return key === 'getByName' ? getByName : Reflect.get(target, key);
      },
    }),
  };
  const getByName = vi.fn(() => ({ run }));
  await scheduled(event('0 3 * * *'), target as typeof env);
  expect(target.SCHEDULED_OPERATIONS.getByName).toHaveBeenCalledWith('recovery');
  expect(run).toHaveBeenCalledWith('0 3 * * *');
  expect((await env.RECOVERY.list()).objects).toHaveLength(0);
});

test('a coordinator failure fails the cron invocation instead of reporting success', async () => {
  const target = {
    ...env,
    SCHEDULED_OPERATIONS: new Proxy(env.SCHEDULED_OPERATIONS, {
      get(target, key) {
        if (key === 'getByName')
          return () => ({
            run: async () => {
              throw new Error('coordinator_unavailable');
            },
          });
        return Reflect.get(target, key);
      },
    }),
  };
  await expect(scheduled(event('*/5 * * * *'), target as typeof env)).rejects.toThrow(
    'coordinator_unavailable',
  );
});

test('overlapping daily and five-minute jobs serialize, and a failed job releases the queue', async () => {
  const stub = env.SCHEDULED_OPERATIONS.getByName('overlap-test');
  await runInDurableObject(stub, async (instance) => {
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const order: string[] = [];
    Reflect.set(instance, 'execute', async (cron: string) => {
      order.push(cron);
      if (cron === '0 3 * * *') {
        await barrier;
        throw new Error('synthetic_failure');
      }
    });
    const first = instance.run('0 3 * * *');
    const failed = expect(first).rejects.toThrow('synthetic_failure');
    const second = instance.run('*/5 * * * *');
    // Let the first asynchronous operation begin, while it remains held at the barrier.
    await Promise.resolve();
    const whileHeld = [...order];
    release();
    await failed;
    await second;
    expect(whileHeld).toEqual(['0 3 * * *']);
    expect(order).toEqual(['0 3 * * *', '*/5 * * * *']);
  });
});

test('unknown cron expressions are refused before any recovery write', async () => {
  await expect(invoke('invalid-cron', '* * * * *')).rejects.toThrow('unsupported_schedule');
  expect((await env.RECOVERY.list()).objects).toHaveLength(0);
});

test('the real coordinator publishes recovery signals and recovers after a failed cleanup', async () => {
  const stub = env.SCHEDULED_OPERATIONS.getByName('real-operations');
  await env.RECOVERY.put('backups/invalid.json', 'synthetic');
  await expect(invoke('real-operations', '*/5 * * * *')).rejects.toThrow('maintenance_failed');
  expect(await (await env.RECOVERY.get('operations/maintenance.json'))!.json()).toMatchObject({
    status: 'error',
  });
  await env.RECOVERY.delete('backups/invalid.json');
  await stub.run('0 3 * * *');
  expect((await env.RECOVERY.list({ prefix: 'backups/' })).objects).toHaveLength(1);
  for (const name of ['maintenance', 'backup'])
    expect(await (await env.RECOVERY.get(`operations/${name}.json`))!.json()).toMatchObject({
      status: 'ok',
    });
});
