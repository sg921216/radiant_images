import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
test('local D1 transactions roll back and local R2 is readable', async () => {
  await env.DB.exec('CREATE TABLE harness (id INTEGER PRIMARY KEY)');
  await expect(
    env.DB.batch([
      env.DB.prepare('INSERT INTO harness VALUES (1)'),
      env.DB.prepare('INSERT INTO harness VALUES (1)'),
    ]),
  ).rejects.toThrow();
  expect(
    (await env.DB.prepare('SELECT COUNT(*) AS count FROM harness').first<{ count: number }>())
      ?.count,
  ).toBe(0);
  await env.MEDIA.put('synthetic-probe', 'synthetic bytes');
  expect(await (await env.MEDIA.get('synthetic-probe'))?.text()).toBe('synthetic bytes');
});
test('each test starts with isolated storage', async () => {
  expect(await env.MEDIA.get('synthetic-probe')).toBeNull();
});
