import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { createApp } from './helpers/app';
import { seedLocalDatabase } from '../src/db/seedData';
import { ownerHeaders } from './helpers/owner';
const now = () => new Date('2026-11-13T12:00:00.000Z');
beforeEach(() => seedLocalDatabase(env.DB, true));
const app = () => createApp({ now, fetch: async () => new Response('', { status: 503 }) });
test('owner can atomically edit a page and unsafe content or mismatched path leaves it unchanged', async () => {
  const headers = await ownerHeaders(env);
  const page = { page: 'about', introMd: 'A new **welcome**.', howItWorks: [] };
  expect(
    (
      await app().request(
        '/admin/pages/about',
        { method: 'PUT', headers, body: JSON.stringify(page) },
        env,
      )
    ).status,
  ).toBe(200);
  for (const input of [
    { ...page, introMd: '<script>alert(1)</script>' },
    { ...page, page: 'family' },
    { ...page, introMd: '[click](javascript:alert(1))' },
  ])
    expect(
      (
        await app().request(
          '/admin/pages/about',
          { method: 'PUT', headers, body: JSON.stringify(input) },
          env,
        )
      ).status,
    ).toBe(400);
  expect(
    (
      await env.DB.prepare("SELECT intro_md FROM page_content WHERE page='about'").first<{
        intro_md: string;
      }>()
    )?.intro_md,
  ).toBe(page.introMd);
});
test('FAQ replacement preserves required topics and rolls back all rows on failure', async () => {
  const headers = await ownerHeaders(env);
  const rows = (
    await env.DB.prepare(
      'SELECT id,question,answer,sort_order AS sortOrder FROM faq_entries ORDER BY sort_order',
    ).all()
  ).results;
  const request = (body: unknown) =>
    app().request('/admin/faq', { method: 'PUT', headers, body: JSON.stringify(body) }, env);
  expect((await request(rows.map((r) => ({ ...r, answer: 'A revised answer.' })))).status).toBe(
    200,
  );
  expect((await request(rows.slice(1))).status).toBe(400);
  expect((await request(rows.map((r) => ({ ...r, question: 'Unrelated topic' })))).status).toBe(
    400,
  );
  await env.DB.exec(
    "CREATE TRIGGER fail_faq BEFORE INSERT ON faq_entries BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;",
  );
  expect((await request(rows)).status).toBe(500);
  expect(
    (
      await env.DB.prepare('SELECT answer FROM faq_entries').all<{ answer: string }>()
    ).results.every((r) => r.answer === 'A revised answer.'),
  ).toBe(true);
});
test('content operations require a current allowed owner', async () => {
  const headers = await ownerHeaders(env);
  for (const path of ['/admin/pages/about', '/admin/faq']) {
    expect((await app().request(path, { method: 'PUT', body: '{}' }, env)).status).toBe(401);
    expect(
      (
        await app().request(
          path,
          { method: 'PUT', headers, body: '{}' },
          { ...env, OWNER_ALLOWLIST: 'another@example.invalid' },
        )
      ).status,
    ).toBe(403);
    await ownerHeaders(env);
  }
});
