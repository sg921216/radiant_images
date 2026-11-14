import { env } from 'cloudflare:workers';
import { beforeEach, expect, test, vi } from 'vitest';
import { createApp } from './helpers/app';
import { seedLocalDatabase } from '../src/db/seedData';
import type { Runtime } from '../src/services/runtime';
const valid = {
  firstName: 'Avery',
  lastName: 'Example',
  email: 'avery@example.invalid',
  contactMethod: 'email',
  shootType: 'family',
  message: 'A synthetic family session',
  turnstileToken: 'synthetic',
};
beforeEach(async () => {
  await seedLocalDatabase(env.DB, true);
});
function fixture(
  mode: 'accepted' | 'rejected' | 'lost' | 'captcha' | 'captcha_outage' = 'accepted',
) {
  let sends = 0;
  const runtime: Runtime = {
    now: () => new Date('2026-11-13T12:00:00Z'),
    fetch: vi.fn(async (input) => {
      const url = String(input);
      if (url.includes('siteverify')) {
        if (mode === 'captcha_outage') throw new Error('outage');
        return Response.json({
          success: mode !== 'captcha',
          hostname: new URL(env.WEB_ORIGIN).hostname,
          action: 'inquiry',
        });
      }
      if (url.includes('/token')) return Response.json({ access_token: 'test' });
      sends++;
      if (mode === 'lost') throw new Error('response lost');
      return mode === 'rejected'
        ? new Response('', { status: 403 })
        : Response.json({ id: 'synthetic-message' });
    }),
  };
  const app = createApp(runtime);
  return {
    runtime,
    send: (body: unknown = valid) =>
      app.request(
        '/inquiries',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        env,
      ),
    sends: () => sends,
  };
}
test('accepted inquiry uses configured recipient/sender, includes fields and retains no content', async () => {
  const f = fixture();
  const response = await f.send({
    ...valid,
    phone: '5551234567',
    preferredDay: '2026-12-01',
    sessionLengthHours: 2,
    numberOfPeople: 4,
    shootLocation: 'Studio',
    referralSource: 'Business Card',
    specialRequests: 'Synthetic request',
    postalCode: '10001',
  });
  expect(response.status).toBe(202);
  expect(await response.json()).toEqual({ status: 'sent' });
  expect(f.sends()).toBe(1);
  const call = f.runtime.fetch as ReturnType<typeof vi.fn>;
  const init = call.mock.calls.at(-1)?.[1] as RequestInit;
  const raw = JSON.parse(String(init.body)).raw;
  const mime = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
  expect(mime).toContain('To: inquiries@example.invalid');
  expect(mime).toContain('From: owner@example.invalid');
  expect(mime).toContain('Reply-To: avery@example.invalid');
  const audit = JSON.stringify((await env.DB.prepare('SELECT * FROM audit_events').all()).results);
  expect(audit).not.toContain(valid.email);
  expect(audit).not.toContain(valid.message);
  const dedupe = await env.DB.prepare('SELECT * FROM inquiry_dedupe').first();
  expect(Object.keys(dedupe ?? {}).sort()).toEqual(['expires_at', 'hash']);
});
test('failed CAPTCHA, stale options and forged delivery fields never dispatch', async () => {
  const invalid = fixture('captcha');
  expect((await invalid.send()).status).toBe(400);
  expect(invalid.sends()).toBe(0);
  for (const fields of [
    { contactMethod: 'text', phone: '' },
    { shootLocation: 'Removed' },
    { senderAddress: 'forged@example.invalid' },
  ]) {
    const f = fixture();
    expect((await f.send({ ...valid, ...fields })).status).toBe(400);
    expect(f.sends()).toBe(0);
  }
});
test('concurrent normalized duplicates dispatch once', async () => {
  const f = fixture();
  const responses = await Promise.all([
    f.send(),
    f.send({ ...valid, email: 'AVERY@example.invalid', message: '  A synthetic family session  ' }),
  ]);
  expect(responses.map((r) => r.status).sort()).toEqual([202, 409]);
  expect(f.sends()).toBe(1);
});
test('definite rejection releases duplicate claim for an explicit retry', async () => {
  const f = fixture('rejected');
  const r = await f.send();
  expect(r.status).toBe(502);
  expect(await r.json()).toMatchObject({ error: { code: 'email_not_sent', retryable: true } });
  expect((await fixture().send()).status).toBe(202);
});
test('lost acceptance response retains duplicate claim and never signals retryable failure', async () => {
  const f = fixture('lost');
  const r = await f.send();
  expect(r.status).toBe(504);
  expect(await r.json()).toMatchObject({
    error: { code: 'email_outcome_unknown', retryable: false },
  });
  expect((await f.send()).status).toBe(409);
  expect(f.sends()).toBe(1);
});
test('known acceptance survives an audit write failure with sanitized fallback', async () => {
  await env.DB.exec(
    "CREATE TRIGGER fail_audit BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;",
  );
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect((await fixture().send()).status).toBe(202);
    expect(JSON.stringify(log.mock.calls)).not.toContain(valid.email);
    expect(JSON.stringify(log.mock.calls)).not.toContain(valid.message);
    expect(log).toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
test('CAPTCHA outage is definite non-delivery and does not claim a duplicate', async () => {
  const f = fixture('captcha_outage');
  const response = await f.send();
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({
    error: { code: 'email_not_sent', retryable: true },
  });
  expect((await env.DB.prepare('SELECT * FROM inquiry_dedupe').all()).results).toHaveLength(0);
});
test.each([
  { contactMethod: 'call', phone: '' },
  { recipient: 'forged@example.invalid' },
  { preferredDay: '2026-11-12' },
  { preferredDay: '2028-05-14' },
  { preferredDay: '2027-02-30' },
  { sessionLengthHours: 0 },
  { sessionLengthHours: 5 },
  { numberOfPeople: 13 },
  { numberOfPeople: 1.5 },
  { message: 'x'.repeat(2001) },
])(
  'API rejects invalid conditional/date/numeric/text fields before dispatch (%#)',
  async (fields) => {
    const f = fixture();
    expect((await f.send({ ...valid, ...fields })).status).toBe(400);
    expect(f.sends()).toBe(0);
  },
);
test('API accepts blank optional fields and the exact timezone calendar boundary', async () => {
  const f = fixture();
  expect(
    (
      await f.send({
        ...valid,
        phone: '',
        postalCode: '',
        sessionLengthHours: '',
        numberOfPeople: '',
        preferredDay: '2028-05-13',
      })
    ).status,
  ).toBe(202);
});
