import { env } from 'cloudflare:workers';
import { beforeAll, expect, test, vi } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createApp } from './helpers/app';
import { sha256 } from '../src/services/crypto';
import { fixedClock } from './helpers/providers';
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => {
  keys = await generateKeyPair('RS256', { extractable: true });
});
const clock = () => fixedClock('2026-11-13T12:00:00.000Z');
async function flow(overrides: Record<string, unknown> = {}) {
  const time = clock();
  let nonce = '';
  const provider = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    if (url.includes('/certs'))
      return Response.json({
        keys: [
          { ...(await exportJWK(keys.publicKey)), kid: 'synthetic-key', alg: 'RS256', use: 'sig' },
        ],
      });
    const token = await new SignJWT({
      email: 'owner@example.invalid',
      email_verified: true,
      nonce,
      ...overrides,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'synthetic-key' })
      .setIssuer(String(overrides.iss ?? 'https://accounts.google.com'))
      .setAudience(String(overrides.aud ?? 'test-client'))
      .setSubject(String(overrides.sub ?? 'synthetic-owner'))
      .setIssuedAt(Number(overrides.iat ?? Math.floor(time.now().getTime() / 1000)))
      .setExpirationTime(Number(overrides.exp ?? Math.floor(time.now().getTime() / 1000) + 300))
      .sign(keys.privateKey);
    return Response.json({
      id_token: token,
      access_token: 'synthetic-provider-token',
      token_type: 'Bearer',
    });
  });
  const app = createApp({ now: time.now, fetch: provider });
  app.get('/admin/probe', (c) => c.json({ private: true }));
  const start = await app.request('/auth/google/start', {}, env);
  expect(start.status).toBe(302);
  const destination = new URL(start.headers.get('location')!);
  nonce = destination.searchParams.get('nonce')!;
  expect(destination.searchParams.get('code_challenge_method')).toBe('S256');
  const cookie = start.headers.get('set-cookie')!.split(';')[0]!;
  const callbackPath = `/auth/google/callback?${new URLSearchParams({ state: destination.searchParams.get('state')!, code: 'synthetic-authorization-code' })}`;
  return { app, time, provider, callbackPath, cookie };
}
async function grant(code = 'g'.repeat(43)) {
  await env.DB.prepare(
    'INSERT INTO exchange_codes(code_hash,owner_email,created_at,expires_at) VALUES(?,?,?,?)',
  )
    .bind(
      await sha256(code),
      'owner@example.invalid',
      '2026-11-13T12:00:00.000Z',
      '2026-11-13T12:01:00.000Z',
    )
    .run();
  return code;
}
function exchange(app: ReturnType<typeof createApp>, code: string, bindings = env) {
  return app.request(
    '/auth/exchange',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    },
    bindings,
  );
}
test('verified browser-bound callback creates only a hashed grant then one usable session', async () => {
  const { app, cookie, callbackPath } = await flow();
  const callback = await app.request(callbackPath, { headers: { cookie } }, env);
  expect(callback.status).toBe(302);
  const destination = new URL(callback.headers.get('location')!);
  expect(destination.pathname).toBe('/admin/callback');
  const code = new URLSearchParams(destination.hash.slice(1)).get('code')!;
  const grants = (await env.DB.prepare('SELECT * FROM exchange_codes').all()).results;
  expect(grants).toHaveLength(1);
  expect(JSON.stringify(grants).includes(code)).toBe(false);
  expect((await env.DB.prepare('SELECT * FROM sessions').all()).results).toHaveLength(0);
  const response = await exchange(app, code);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const result = await response.json<{ token: string }>();
  expect(
    JSON.stringify((await env.DB.prepare('SELECT * FROM sessions').all()).results).includes(
      result.token,
    ),
  ).toBe(false);
  expect(
    (
      await app.request(
        '/auth/session',
        { headers: { Authorization: `Bearer ${result.token}` } },
        env,
      )
    ).status,
  ).toBe(200);
  expect((await exchange(app, code)).status).toBe(400);
  expect((await app.request(callbackPath, { headers: { cookie } }, env)).status).toBe(400);
});
test('wrong browser binding, invalid identity and a non-owner never acquire a grant', async () => {
  const first = await flow();
  expect(
    (
      await first.app.request(
        first.callbackPath,
        { headers: { cookie: 'radiant_oauth_local=incorrect' } },
        env,
      )
    ).status,
  ).toBe(400);
  const invalid = await flow({ email_verified: false });
  expect(
    (await invalid.app.request(invalid.callbackPath, { headers: { cookie: invalid.cookie } }, env))
      .status,
  ).toBe(400);
  const outsider = await flow({ email: 'outsider@example.invalid' });
  const response = await outsider.app.request(
    outsider.callbackPath,
    { headers: { cookie: outsider.cookie } },
    env,
  );
  expect(new URL(response.headers.get('location')!).pathname).toBe('/admin/denied');
  expect((await env.DB.prepare('SELECT * FROM exchange_codes').all()).results).toHaveLength(0);
});
test('provider outage fails closed and all admin operations require an owner', async () => {
  const f = await flow();
  f.provider.mockResolvedValue(Response.json({ error: 'unavailable' }, { status: 503 }));
  expect((await f.app.request(f.callbackPath, { headers: { cookie: f.cookie } }, env)).status).toBe(
    502,
  );
  expect((await f.app.request('/admin/probe', {}, env)).status).toBe(401);
});
test('concurrent exchange has exactly one winner; removed owners invalidate grants', async () => {
  const app = createApp({ now: clock().now, fetch });
  const code = await grant();
  const results = await Promise.all([exchange(app, code), exchange(app, code)]);
  expect(results.map((x) => x.status).sort()).toEqual([200, 400]);
  expect((await env.DB.prepare('SELECT * FROM sessions').all()).results).toHaveLength(1);
  const removed = await grant('r'.repeat(43));
  expect((await exchange(app, removed, { ...env, OWNER_ALLOWLIST: '' })).status).toBe(403);
  expect((await env.DB.prepare('SELECT * FROM exchange_codes').all()).results).toHaveLength(0);
});
test('failed session transaction preserves the grant; expired grants do not create sessions', async () => {
  const code = await grant();
  const time = clock();
  const app = createApp({ now: time.now, fetch });
  await env.DB.exec(
    "CREATE TRIGGER fail_session BEFORE INSERT ON sessions BEGIN SELECT RAISE(ABORT,'synthetic failure'); END",
  );
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect((await exchange(app, code)).status).toBe(500);
  } finally {
    log.mockRestore();
  }
  expect((await env.DB.prepare('SELECT * FROM exchange_codes').all()).results).toHaveLength(1);
  expect((await env.DB.prepare('SELECT * FROM sessions').all()).results).toHaveLength(0);
  await env.DB.exec('DROP TRIGGER fail_session');
  time.advance(60000);
  expect((await exchange(app, code)).status).toBe(400);
});
test('session expiry, allow-list removal and logout revoke access; lost response requires new sign-in', async () => {
  const time = clock();
  const app = createApp({ now: time.now, fetch });
  const code = await grant();
  await exchange(app, code);
  expect((await exchange(app, code)).status).toBe(400);
  const fresh = await exchange(app, await grant('f'.repeat(43)));
  const { token } = await fresh.json<{ token: string }>();
  const headers = { Authorization: `Bearer ${token}` };
  expect(
    (await app.request('/auth/session', { headers }, { ...env, OWNER_ALLOWLIST: '' })).status,
  ).toBe(403);
  expect((await app.request('/auth/session', { headers }, env)).status).toBe(401);
  const second = await exchange(app, await grant('s'.repeat(43)));
  const other = await second.json<{ token: string }>();
  expect(
    (
      await app.request(
        '/auth/logout',
        { method: 'POST', headers: { Authorization: `Bearer ${other.token}` } },
        env,
      )
    ).status,
  ).toBe(204);
  expect(
    (
      await app.request(
        '/auth/session',
        { headers: { Authorization: `Bearer ${other.token}` } },
        env,
      )
    ).status,
  ).toBe(401);
  const third = await exchange(app, await grant('t'.repeat(43)));
  const last = await third.json<{ token: string }>();
  time.advance(24 * 60 * 60 * 1000);
  expect(
    (
      await app.request(
        '/auth/session',
        { headers: { Authorization: `Bearer ${last.token}` } },
        env,
      )
    ).status,
  ).toBe(401);
});

test.each([
  { iss: 'https://evil.invalid' },
  { aud: 'wrong-client' },
  { sub: '' },
  { nonce: 'wrong-nonce' },
  { azp: 'wrong-party' },
  { exp: 1 },
  { iat: 9999999999 },
])('ID token checks reject invalid claims %#', async (claims) => {
  const f = await flow(claims);
  const response = await f.app.request(f.callbackPath, { headers: { cookie: f.cookie } }, env);
  expect(response.status).toBe(400);
  expect((await env.DB.prepare('SELECT * FROM exchange_codes').all()).results).toHaveLength(0);
});
test('unavailable signing keys are a provider outage, without a grant', async () => {
  const f = await flow();
  const prior = f.provider.getMockImplementation()!;
  f.provider.mockImplementation(async (input, init) =>
    String(input).includes('/certs') ? new Response(null, { status: 503 }) : prior(input, init),
  );
  expect((await f.app.request(f.callbackPath, { headers: { cookie: f.cookie } }, env)).status).toBe(
    502,
  );
  expect((await env.DB.prepare('SELECT * FROM exchange_codes').all()).results).toHaveLength(0);
});
test('sliding renewal cannot extend the seven-day absolute expiry', async () => {
  const time = clock();
  const app = createApp({ now: time.now, fetch });
  const response = await exchange(app, await grant());
  const { token } = await response.json<{ token: string }>();
  const headers = { Authorization: `Bearer ${token}` };
  for (let n = 0; n < 7; n++) {
    time.advance(23 * 60 * 60 * 1000);
    expect((await app.request('/auth/session', { headers }, env)).status).toBe(200);
  }
  time.advance(7 * 60 * 60 * 1000);
  expect((await app.request('/auth/session', { headers }, env)).status).toBe(401);
});
