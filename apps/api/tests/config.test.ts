import { env } from 'cloudflare:workers';
import { beforeEach, expect, test, vi } from 'vitest';
import { createApp } from './helpers/app';
import { ownerHeaders } from './helpers/owner';
import { seedLocalDatabase } from '../src/db/seedData';
import type { Runtime } from '../src/services/runtime';
let headers: Record<string, string>;
beforeEach(async () => {
  await seedLocalDatabase(env.DB, true);
  headers = await ownerHeaders(env);
});
const draft = {
  inquiryRecipient: 'new-inquiries@example.invalid',
  senderAddress: 'owner@example.invalid',
  publicContactEmail: 'public@example.invalid',
  shootLocations: ['Garden', 'Studio'],
  referralSources: ['Friend', 'Search'],
  timezone: 'America/New_York',
};
function fixture(verified = true) {
  const sent: string[] = [];
  const runtime: Runtime = {
    now: () => new Date('2026-11-13T12:00:00Z'),
    fetch: vi.fn(async (input, init) => {
      const url = String(input);
      if (url.includes('siteverify'))
        return Response.json({
          success: true,
          hostname: new URL(env.WEB_ORIGIN).hostname,
          action: 'inquiry',
        });
      if (url.includes('/token')) return Response.json({ access_token: 'synthetic' });
      if (url.includes('/settings/sendAs'))
        return Response.json({
          sendAs: [
            {
              sendAsEmail: 'owner@example.invalid',
              verificationStatus: verified ? 'accepted' : 'pending',
            },
          ],
        });
      if (url.endsWith('/messages/send')) {
        sent.push(atob(JSON.parse(String(init?.body)).raw.replace(/-/g, '+').replace(/_/g, '/')));
        return Response.json({ id: 'synthetic' });
      }
      throw new Error('Unexpected provider');
    }),
  };
  const app = createApp(runtime);
  return {
    app,
    runtime,
    sent,
    save: (body: unknown = draft) =>
      app.request('/admin/config', { method: 'PUT', headers, body: JSON.stringify(body) }, env),
  };
}
test('settings save atomically, keep public contact independent and direct subsequent inquiries to the new private recipient', async () => {
  const f = fixture();
  expect((await f.save()).status).toBe(200);
  expect(await (await f.app.request('/admin/config', { headers }, env)).json()).toEqual(draft);
  const bootstrap = (await (await f.app.request('/public/bootstrap', {}, env)).json()) as {
    config: Record<string, unknown>;
  };
  expect(bootstrap.config).toEqual({
    shootLocations: draft.shootLocations,
    referralSources: draft.referralSources,
    timezone: draft.timezone,
    publicContactEmail: draft.publicContactEmail,
  });
  const response = await f.app.request(
    '/inquiries',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Avery',
        lastName: 'Example',
        email: 'avery@example.invalid',
        contactMethod: 'email',
        shootType: 'family',
        shootLocation: 'Garden',
        turnstileToken: 'synthetic',
      }),
    },
    env,
  );
  expect(response.status).toBe(202);
  expect(f.sent[0]).toContain(`To: ${draft.inquiryRecipient}`);
  expect(f.sent[0]).toContain(`From: ${draft.senderAddress}`);
  expect(f.sent[0]).not.toContain(draft.publicContactEmail);
});
test('malformed or missing contact addresses, duplicate/empty options and unverified sender preserve the complete old configuration', async () => {
  const f = fixture();
  expect((await f.save()).status).toBe(200);
  for (const changes of [
    { publicContactEmail: '' },
    { publicContactEmail: 'bad' },
    { inquiryRecipient: 'bad' },
    { senderAddress: 'bad' },
    { shootLocations: [] },
    { shootLocations: ['Same', ' Same '] },
    { referralSources: [] },
    { timezone: 'Not/AZone' },
  ])
    expect((await f.save({ ...draft, ...changes })).status).toBe(400);
  const missing = { ...draft } as Partial<typeof draft>;
  delete missing.publicContactEmail;
  expect((await f.save(missing)).status).toBe(400);
  expect(
    (await fixture(false).save({ ...draft, inquiryRecipient: 'changed@example.invalid' })).status,
  ).toBe(400);
  expect(await (await f.app.request('/admin/config', { headers }, env)).json()).toEqual(draft);
});
test('provider outage and audit failure cannot partially update settings, and old form selections are rejected', async () => {
  const f = fixture();
  expect((await f.save()).status).toBe(200);
  const unavailable = createApp({
    now: () => new Date('2026-11-13T12:00:00Z'),
    fetch: async () => {
      throw new Error('synthetic provider outage');
    },
  });
  expect(
    (
      await unavailable.request(
        '/admin/config',
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...draft, publicContactEmail: 'changed@example.invalid' }),
        },
        env,
      )
    ).status,
  ).toBe(502);
  await env.DB.exec(
    "CREATE TRIGGER fail_config_audit BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'synthetic audit failure'); END;",
  );
  expect((await f.save({ ...draft, publicContactEmail: 'changed@example.invalid' })).status).toBe(
    500,
  );
  expect(await (await f.app.request('/admin/config', { headers }, env)).json()).toEqual(draft);
  expect(
    (
      await f.app.request(
        '/inquiries',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: 'Avery',
            lastName: 'Example',
            email: 'avery@example.invalid',
            contactMethod: 'email',
            shootType: 'family',
            shootLocation: 'Outdoors',
            turnstileToken: 'synthetic',
          }),
        },
        env,
      )
    ).status,
  ).toBe(400);
  expect(f.sent).toHaveLength(0);
});
