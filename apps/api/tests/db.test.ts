import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import { seedLocalDatabase } from '../src/db/seedData';
const id = (n: number) => `01TEST00000000000000${String(n).padStart(6, '0')}`;
const now = '2026-11-13T12:00:00.000Z';
const tables = [
  'lifecycle_state',
  'gallery_images',
  'banners',
  'pricing_revisions',
  'pricing_packages',
  'pricing_publication',
  'faq_entries',
  'page_content',
  'site_config',
  'inquiry_dedupe',
  'rate_limit_windows',
  'sessions',
  'oauth_states',
  'exchange_codes',
  'audit_events',
  'clients',
  'email_templates',
  'client_emails',
  'checklist_items',
  'client_checklist_state',
  'questionnaire_questions',
  'questionnaire_invites',
  'questionnaire_responses',
];
test('migrations create the complete model without an inquiry-content table', async () => {
  const actual = (
    await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{
      name: string;
    }>()
  ).results.map((x) => x.name);
  expect(actual).toEqual(expect.arrayContaining(tables));
  expect(actual.filter((x) => x.startsWith('inquiry'))).toEqual(['inquiry_dedupe']);
});
test('seeding is local-only, repeatable and includes public defaults and complete pricing', async () => {
  await expect(seedLocalDatabase(env.DB, false)).rejects.toThrow();
  await seedLocalDatabase(env.DB, true);
  await seedLocalDatabase(env.DB, true);
  expect(
    (
      await env.DB.prepare('SELECT public_contact_email FROM site_config').first<{
        public_contact_email: string;
      }>()
    )?.public_contact_email,
  ).toBe('hello@example.invalid');
  expect(
    (await env.DB.prepare('SELECT COUNT(*) AS count FROM faq_entries').first<{ count: number }>())
      ?.count,
  ).toBe(4);
  expect(
    (await env.DB.prepare('SELECT DISTINCT shoot_type FROM pricing_packages').all()).results,
  ).toHaveLength(3);
  expect((await env.DB.prepare('SELECT * FROM pricing_publication').all()).results).toHaveLength(1);
});
test('pricing singleton foreign keys and transaction rollback preserve the published pointer', async () => {
  await seedLocalDatabase(env.DB, true);
  const before = await env.DB.prepare(
    'SELECT current_revision_id FROM pricing_publication',
  ).first();
  await expect(
    env.DB.prepare('UPDATE pricing_publication SET current_revision_id=?').bind(id(999)).run(),
  ).rejects.toThrow();
  await expect(
    env.DB.prepare('INSERT INTO pricing_publication VALUES(2,?)').bind(id(999)).run(),
  ).rejects.toThrow();
  await expect(
    env.DB.batch([
      env.DB.prepare(
        'INSERT INTO pricing_revisions(id,published_at,created_by) VALUES(?,?,?)',
      ).bind(id(900), now, 'owner@example.invalid'),
      env.DB.prepare('UPDATE pricing_publication SET current_revision_id=?').bind(id(900)),
      env.DB.prepare('INSERT INTO pricing_publication VALUES(2,?)').bind(id(900)),
    ]),
  ).rejects.toThrow();
  expect(
    await env.DB.prepare('SELECT current_revision_id FROM pricing_publication').first(),
  ).toEqual(before);
  expect(
    await env.DB.prepare('SELECT id FROM pricing_revisions WHERE id=?').bind(id(900)).first(),
  ).toBeNull();
});
async function client(n: number) {
  await env.DB.prepare(
    'INSERT INTO clients(id,first_name,last_name,email,shoot_type) VALUES(?,?,?,?,?)',
  )
    .bind(id(n), 'Synthetic', 'Client', `fixture${n}@example.invalid`, 'family')
    .run();
}
test('client cascade removes answers/history/progress and associations cannot cross clients', async () => {
  await client(1);
  await client(2);
  await env.DB.prepare(
    'INSERT INTO questionnaire_invites(id,client_id,token_hash,questions_snapshot,sent_at,expires_at) VALUES(?,?,?,?,?,?)',
  )
    .bind(id(3), id(1), 'a'.repeat(64), '[]', now, '2026-12-13T12:00:00.000Z')
    .run();
  const email = (n: number, clientId: string) =>
    env.DB.prepare(
      'INSERT INTO client_emails(id,client_id,questionnaire_invite_id,subject,body,gmail_message_id,sent_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(id(n), clientId, id(3), 'Synthetic', '[questionnaire link omitted]', 'synthetic', now);
  await expect(email(4, id(2)).run()).rejects.toThrow();
  await email(4, id(1)).run();
  await env.DB.prepare('INSERT INTO questionnaire_responses VALUES(?,?,?)')
    .bind(id(3), '{}', now)
    .run();
  await env.DB.prepare('INSERT INTO checklist_items(id,label,sort_order) VALUES(?,?,0)')
    .bind(id(5), 'Synthetic step')
    .run();
  await env.DB.prepare('INSERT INTO client_checklist_state(client_id,item_id) VALUES(?,?)')
    .bind(id(1), id(5))
    .run();
  await env.DB.prepare('DELETE FROM clients WHERE id=?').bind(id(1)).run();
  for (const table of [
    'questionnaire_invites',
    'questionnaire_responses',
    'client_emails',
    'client_checklist_state',
  ])
    expect(
      (await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>())
        ?.count,
    ).toBe(0);
  expect(
    await env.DB.prepare('SELECT id FROM clients WHERE id=?').bind(id(2)).first(),
  ).not.toBeNull();
});
test('hash constraints reject raw grants and grants have no session reference', async () => {
  await expect(
    env.DB.prepare('INSERT INTO exchange_codes VALUES(?,?,?,?)')
      .bind('raw-secret', 'owner@example.invalid', now, now)
      .run(),
  ).rejects.toThrow();
  const columns = (
    await env.DB.prepare('PRAGMA table_info(exchange_codes)').all<{ name: string }>()
  ).results.map((x) => x.name);
  expect(columns).toContain('code_hash');
  expect(columns).not.toContain('session_id');
});
test('gallery enforces pixel limits and capacity in database writes', async () => {
  const image = (n: number, width = 2000) =>
    env.DB.prepare(
      'INSERT INTO gallery_images(id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height) VALUES(?,?,?,?,?,?,?,?,?,?)',
    ).bind(
      id(n),
      'family',
      'Synthetic test pattern',
      n,
      width,
      1000,
      'image/png',
      1000,
      2000,
      1000,
    );
  await expect(image(999, 2001).run()).rejects.toThrow();
  await env.DB.batch(Array.from({ length: 60 }, (_, i) => image(i)));
  await expect(image(61).run()).rejects.toThrow();
});
