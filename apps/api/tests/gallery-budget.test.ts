import { env } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { expect, test } from 'vitest';
import { ownerHeaders } from './helpers/owner';
import { contract } from './helpers/app';
import { assertContract } from './helpers/contracts';

test('a persistent rolling upload allowance rejects churn before image processing', async () => {
  const stub = env.GALLERY_MUTATIONS.getByName('budget-test');
  const now = Date.now();
  await runInDurableObject(stub, (_, state) =>
    state.storage.put('upload-attempts', Array<number>(299).fill(now)),
  );
  const upload = async (authorized = true) => {
    const headers = new Headers(authorized ? await ownerHeaders(env, new Date()) : {});
    headers.delete('Content-Type');
    return stub.fetch('https://api.rehearsal.invalid/admin/gallery', {
      method: 'POST',
      body: new FormData(),
      headers,
    });
  };
  // The last admitted attempt is counted even though its payload is invalid.
  expect((await upload()).status).toBe(400);
  const blocked = await upload();
  expect(blocked.status).toBe(429);
  await assertContract(contract, '/admin/gallery', 'post', blocked);
  expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(29 * 86400);
  expect(await blocked.json()).toMatchObject({ error: { code: 'rate_limited' } });
  expect((await upload(false)).status).toBe(401);
  await runInDurableObject(stub, async (_, state) => {
    expect(await state.storage.get('upload-attempts')).toHaveLength(300);
    await state.storage.put('upload-attempts', Array<number>(300).fill(now - 30 * 86400000 - 1000));
  });
  expect((await upload()).status).toBe(400);
  await runInDurableObject(stub, async (_, state) =>
    expect(await state.storage.get('upload-attempts')).toHaveLength(1),
  );
});
