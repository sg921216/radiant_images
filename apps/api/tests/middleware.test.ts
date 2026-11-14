import { env } from 'cloudflare:workers';
import { expect, test, vi } from 'vitest';
import { createApp } from './helpers/app';
import { consumeRateLimit } from '../src/middleware/rateLimit';
import { audit } from '../src/services/audit';
test('configured origin alone gets CORS, authorization preflight and request correlation', async () => {
  const app = createApp();
  app.get('/probe', (c) => c.json({ ok: true }));
  const response = await app.request('/probe', { headers: { Origin: env.WEB_ORIGIN } }, env);
  expect(response.headers.get('access-control-allow-origin')).toBe(env.WEB_ORIGIN);
  expect(response.headers.get('x-request-id')).toBeTruthy();
  expect(
    (await app.request('/probe', { headers: { Origin: 'https://evil.invalid' } }, env)).headers.get(
      'access-control-allow-origin',
    ),
  ).not.toBe('https://evil.invalid');
  const preflight = await app.request(
    '/probe',
    {
      method: 'OPTIONS',
      headers: { Origin: env.WEB_ORIGIN, 'Access-Control-Request-Headers': 'authorization' },
    },
    env,
  );
  expect(preflight.headers.get('access-control-allow-headers')?.toLowerCase()).toContain(
    'authorization',
  );
});
test('body limits apply to actual bytes without trusting declared length', async () => {
  const app = createApp();
  app.post('/probe', (c) => c.json({ size: 1 }));
  const response = await app.request(
    '/probe',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(65537) },
    env,
  );
  expect(response.status).toBe(413);
});
test('internal errors and logs exclude visitor details and tokenized URLs', async () => {
  const output = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const app = createApp();
    app.get('/q/:token', () => {
      throw new Error('private@example.invalid SECRET_QUESTIONNAIRE_TOKEN');
    });
    const response = await app.request('/q/' + 'SECRET_QUESTIONNAIRE_TOKEN', {}, env);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: { code: 'internal_error', message: 'Something went wrong. Please try again later.' },
    });
    const log = JSON.stringify(output.mock.calls);
    expect(log.includes('private@example.invalid')).toBe(false);
    expect(log.includes('SECRET_QUESTIONNAIRE_TOKEN')).toBe(false);
  } finally {
    output.mockRestore();
  }
});
test('atomic fixed windows admit only the quota across concurrent requests and reset at boundary', async () => {
  const take = (now: number) =>
    consumeRateLimit(env.DB, env.RATE_LIMIT_KEY, 'inquiry', '203.0.113.42', 5, 600, now);
  const results = await Promise.all(Array.from({ length: 12 }, () => take(601)));
  expect(results.filter((x) => x.allowed)).toHaveLength(5);
  expect(results.find((x) => !x.allowed)?.retryAfter).toBe(599);
  expect((await take(1200)).allowed).toBe(true);
  const stored = JSON.stringify(
    (await env.DB.prepare('SELECT * FROM rate_limit_windows').all()).results,
  );
  expect(stored.includes('203.0.113.42')).toBe(false);
});
test('public inquiry limits return 429 and numeric Retry-After', async () => {
  const app = createApp();
  app.post('/inquiries', (c) => c.json({ ok: true }));
  let response: Response | undefined;
  for (let n = 0; n < 6; n++)
    response = await app.request(
      '/inquiries',
      { method: 'POST', headers: { 'CF-Connecting-IP': '203.0.113.1' } },
      env,
    );
  expect(response?.status).toBe(429);
  expect(Number(response?.headers.get('Retry-After'))).toBeGreaterThan(0);
});
test('audit stores approved operational fields without visitor content', async () => {
  await audit(env.DB, {
    actor: 'visitor',
    action: 'inquiry.failed',
    outcome: 'error',
    requestId: 'synthetic',
    detail: {
      code: 'captcha_failed',
      count: 1,
      email: 'private@example.invalid',
      message: 'private message',
      token: 'SECRET_TOKEN',
    },
  });
  const row = await env.DB.prepare('SELECT * FROM audit_events').first<{ detail: string }>();
  expect(row).not.toBeNull();
  expect(JSON.parse(row!.detail)).toEqual({ code: 'captcha_failed', count: 1 });
});
