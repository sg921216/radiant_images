import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { createApp, contract } from './helpers/app';
import { seedLocalDatabase } from '../src/db/seedData';
import { ownerHeaders } from './helpers/owner';

beforeEach(() => seedLocalDatabase(env.DB, true));

test('the integration harness validates actual application responses against the matching operation', async () => {
  expect(contract.paths['/pricing']?.get).toBeDefined();
  const app = createApp();
  app.fetch = async () => Response.json({ unexpected: true });
  await expect(app.request('/pricing', {}, env)).rejects.toThrow(
    'Contract schema mismatch: get /pricing 200',
  );
});

test.each(['/admin/banners', '/admin/questionnaire'])(
  '%s returns its declared success response for an authenticated owner',
  async (path) => {
    const now = new Date('2026-11-13T12:00:00Z');
    const app = createApp({ now: () => now, fetch });
    const response = await app.request(path, { headers: await ownerHeaders(env, now) }, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toBeDefined();
  },
);

test('Google sign-in start enforces its declared rate-limit error before redirecting again', async () => {
  const app = createApp({ now: () => new Date('2026-11-13T12:00:00Z'), fetch });
  for (let attempt = 0; attempt < 10; attempt++)
    expect((await app.request('/auth/google/start', {}, env)).status).toBe(302);
  const blocked = await app.request('/auth/google/start', {}, env);
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  expect(await blocked.json()).toMatchObject({ error: { code: 'rate_limited' } });
});
