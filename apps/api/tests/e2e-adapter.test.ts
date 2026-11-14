import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import { resetSynthetic } from '../../../e2e/adapter';
import { seedPerformanceData } from '../../../e2e/performance-data';
import { createApp } from './helpers/app';
test('browser reset seeds synthetic data, removes previous state and refuses a remote origin', async () => {
  await expect(
    resetSynthetic({ ...env, WEB_ORIGIN: 'https://production.invalid' }),
  ).rejects.toThrow();
  await resetSynthetic(env);
  expect(await env.DB.prepare('SELECT id FROM site_config WHERE id=1').first()).not.toBeNull();
  await env.DB.prepare('INSERT INTO inquiry_dedupe (hash,expires_at) VALUES (?,?)')
    .bind('a'.repeat(64), '2030-01-01T00:00:00.000Z')
    .run();
  await env.MEDIA.put('synthetic-stale', 'data');
  await resetSynthetic(env);
  expect((await env.DB.prepare('SELECT * FROM inquiry_dedupe').all()).results).toHaveLength(0);
  expect(await env.MEDIA.get('synthetic-stale')).toBeNull();
  expect((await env.DB.prepare('SELECT * FROM pricing_publication').all()).results).toHaveLength(1);
});
test('performance content uses 200 clients, complete pricing, an active banner and immutable ten-question invitation', async () => {
  await resetSynthetic(env);
  const now = new Date('2026-11-13T12:00:00Z');
  const result = await seedPerformanceData(env, now);
  expect((await env.DB.prepare('SELECT id FROM clients').all()).results).toHaveLength(200);
  expect((await env.DB.prepare('SELECT id FROM pricing_packages').all()).results).toHaveLength(9);
  expect(
    (await env.DB.prepare('SELECT id FROM questionnaire_questions').all()).results,
  ).toHaveLength(10);
  expect(
    (
      await env.DB.prepare('SELECT id FROM banners WHERE starts_at<=? AND ends_at>?')
        .bind(now.toISOString(), now.toISOString())
        .all()
    ).results,
  ).toHaveLength(1);
  expect(result.ownerToken.length === 43 && result.questionnaireToken.length === 43).toBe(true);
  const state = await env.DB.prepare('SELECT questions_snapshot FROM questionnaire_invites').first<{
    questions_snapshot: string;
  }>();
  expect(JSON.parse(state!.questions_snapshot)).toHaveLength(10);
  expect(
    (
      await createApp({
        now: () => now,
        fetch: async () => new Response('', { status: 503 }),
      }).request('/public/bootstrap', {}, env)
    ).status,
  ).toBe(200);
});
