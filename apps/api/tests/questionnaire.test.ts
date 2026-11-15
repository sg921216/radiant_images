import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { createApp } from './helpers/app';
import { ownerHeaders } from './helpers/owner';
import { seedLocalDatabase } from '../src/db/seedData';
import type { Client, Question, QuestionnaireInvite } from '@radiant/shared';
import type { Runtime } from '../src/services/runtime';
import { getInvitation } from '../src/services/questionnaire';
let headers: Record<string, string>;
let clock = '2026-11-13T12:00:00.000Z';
beforeEach(async () => {
  clock = '2026-11-13T12:00:00.000Z';
  await seedLocalDatabase(env.DB, true);
  headers = await ownerHeaders(env);
});
const question: Question = {
  id: '01K00000000000000000000001',
  prompt: 'Choose your setting',
  kind: 'single_choice',
  options: ['Studio', 'Garden'],
  required: true,
  sortOrder: 0,
};
function fixture(mode: 'accepted' | 'rejected' | 'lost' = 'accepted') {
  const messages: { subject: string; body: string; mime: string }[] = [];
  const runtime: Runtime = {
    now: () => new Date(clock),
    fetch: async (input, init) => {
      if (String(input).endsWith('/token')) return Response.json({ access_token: 'synthetic' });
      if (!String(input).endsWith('/messages/send')) throw new Error('Unexpected provider');
      if (mode === 'rejected') return new Response('', { status: 403 });
      const mime = atob(JSON.parse(String(init?.body)).raw.replace(/-/g, '+').replace(/_/g, '/'));
      const [head, body] = mime.split('\r\n\r\n');
      const subject = (head!.replace(/\r\n /g, '').match(/^Subject: (.*)$/m)?.[1] ?? '').replace(
        /=\?UTF-8\?B\?([^?]+)\?=/g,
        (_match, encoded: string) => atob(encoded),
      );
      messages.push({ subject, body: atob(body!.replace(/\s/g, '')), mime });
      if (mode === 'lost') throw new Error('Synthetic response loss');
      return Response.json({ id: 'synthetic-message' });
    },
  };
  const app = createApp(runtime);
  const call = (path: string, method = 'GET', body?: unknown) =>
    app.request(
      path,
      { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
      env,
    );
  return { app, call, messages };
}
async function prepare(f: ReturnType<typeof fixture>) {
  const created = await f.call('/admin/clients', 'POST', {
    firstName: 'Avery',
    lastName: 'Example',
    email: 'avery@example.invalid',
    shootType: 'family',
  });
  expect(created.status).toBe(201);
  expect((await f.call('/admin/questionnaire', 'PUT', [question])).status).toBe(200);
  return (await created.json()) as Client;
}
function token(f: ReturnType<typeof fixture>) {
  const value = f.messages[0]?.body.match(/\/q\/([A-Za-z0-9_-]{43})/)?.[1];
  if (!value) throw new Error('Synthetic dispatch contained no questionnaire link');
  return value;
}
test('questionnaire invitation snapshots questions, exposes only minimum public data, accepts once and survives master edits', async () => {
  const f = fixture(),
    client = await prepare(f);
  const response = await f.call(`/admin/clients/${client.id}/questionnaires`, 'POST');
  expect(response.status).toBe(201);
  const invite = (await response.json()) as QuestionnaireInvite;
  expect(invite).toMatchObject({
    questionsSnapshot: [question],
    answers: null,
    status: 'pending',
    expiresAt: '2026-12-13T12:00:00.000Z',
  });
  const secret = token(f);
  expect(JSON.stringify(invite).includes(secret)).toBe(false);
  const publicResponse = await f.call(`/questionnaire/${secret}`);
  const data = (await publicResponse.json()) as Record<string, unknown>;
  expect(Object.keys(data).sort()).toEqual(['clientFirstName', 'questions', 'status']);
  expect(data).toMatchObject({
    clientFirstName: 'Avery',
    questions: [question],
    status: 'pending',
  });
  const attempts = await Promise.all([
    f.call(`/questionnaire/${secret}`, 'POST', { answers: { [question.id]: 'Garden' } }),
    f.call(`/questionnaire/${secret}`, 'POST', { answers: { [question.id]: 'Studio' } }),
  ]);
  expect(attempts.map((r) => r.status).sort()).toEqual([201, 409]);
  expect((await f.call('/admin/questionnaire', 'PUT', [])).status).toBe(200);
  const detail = (await (await f.call(`/admin/clients/${client.id}`)).json()) as {
    questionnaires: QuestionnaireInvite[];
  };
  expect(detail.questionnaires[0]).toMatchObject({
    id: invite.id,
    status: 'submitted',
    questionsSnapshot: [question],
  });
  expect(['Garden', 'Studio'].includes(detail.questionnaires[0]!.answers![question.id]!)).toBe(
    true,
  );
  expect(
    (await f.call(`/questionnaire/${secret}`, 'POST', { answers: { [question.id]: 'Garden' } }))
      .status,
  ).toBe(409);
});
test('snapshot answer validation, exact 30-day expiry and client deletion close public access', async () => {
  const f = fixture(),
    client = await prepare(f);
  expect((await f.call(`/admin/clients/${client.id}/questionnaires`, 'POST')).status).toBe(201);
  const secret = token(f);
  for (const answers of [
    {},
    { [question.id]: 'Other' },
    { [question.id]: ['Garden'] },
    { [question.id]: 'Garden', unknown: 'extra' },
  ])
    expect((await f.call(`/questionnaire/${secret}`, 'POST', { answers })).status).toBe(400);
  clock = '2026-12-13T12:00:00.000Z';
  expect(
    ((await (await f.call(`/questionnaire/${secret}`)).json()) as { status: string }).status,
  ).toBe('expired');
  expect(
    (await f.call(`/questionnaire/${secret}`, 'POST', { answers: { [question.id]: 'Garden' } }))
      .status,
  ).toBe(409);
  headers = await ownerHeaders(env, new Date(clock));
  expect((await f.call(`/admin/clients/${client.id}`, 'DELETE')).status).toBe(204);
  expect((await f.call(`/questionnaire/${secret}`)).status).toBe(404);
});
test('ordinary email has no invitation; template links share one invitation and all retained subject/body links are omitted', async () => {
  const f = fixture(),
    client = await prepare(f);
  const ordinary = await f.call(`/admin/clients/${client.id}/emails`, 'POST', {
    subject: 'Hello {{firstName}}',
    body: 'Your {{shootType}} session is {{sessionDate}}.',
  });
  expect(ordinary.status).toBe(201);
  expect(await ordinary.json()).toMatchObject({
    questionnaireInviteId: null,
    subject: 'Hello Avery',
    body: 'Your Family session is Not scheduled.',
  });
  f.messages.length = 0;
  const response = await f.call(`/admin/clients/${client.id}/emails`, 'POST', {
    subject: 'Your link {{questionnaireLink}}',
    body: 'Hello {{firstName}}: {{questionnaireLink}} and {{questionnaireLink}}',
  });
  expect(response.status).toBe(201);
  const history = (await response.json()) as {
    questionnaireInviteId: string;
    subject: string;
    body: string;
  };
  expect(history.questionnaireInviteId).toBeTruthy();
  expect(history.subject).toBe('Your link [questionnaire link omitted]');
  expect(history.body).toBe(
    'Hello Avery: [questionnaire link omitted] and [questionnaire link omitted]',
  );
  const secret = token(f);
  expect(f.messages[0]!.mime).toContain('From: owner@example.invalid');
  expect(f.messages[0]!.mime).toContain('Reply-To: owner@example.invalid');
  expect(f.messages[0]!.subject.includes(secret)).toBe(true);
  expect(f.messages[0]!.body.split(secret).length - 1).toBe(2);
  for (const table of ['client_emails', 'questionnaire_invites', 'audit_events'])
    expect(
      JSON.stringify((await env.DB.prepare(`SELECT * FROM ${table}`).all()).results).includes(
        secret,
      ),
    ).toBe(false);
  expect((await (await f.call(`/admin/clients/${client.id}`)).text()).includes(secret)).toBe(false);
});
test('literal questionnaire links are rejected before storage or sending', async () => {
  const f = fixture(),
    client = await prepare(f);
  const response = await f.call(`/admin/clients/${client.id}/emails`, 'POST', {
    subject: 'Link',
    body: `${env.WEB_ORIGIN}/q/${'a'.repeat(43)}`,
  });
  expect(response.status).toBe(400);
  expect(f.messages.length).toBe(0);
  expect((await env.DB.prepare('SELECT * FROM questionnaire_invites').all()).results).toHaveLength(
    0,
  );
});
test('definite rejection invalidates an invite; uncertain acceptance preserves it without inventing history', async () => {
  const failed = fixture('rejected'),
    client = await prepare(failed);
  const rejected = await failed.call(`/admin/clients/${client.id}/questionnaires`, 'POST');
  expect(rejected.status).toBe(502);
  expect(await rejected.json()).toMatchObject({
    error: { code: 'email_not_sent', retryable: true },
  });
  expect((await env.DB.prepare('SELECT * FROM questionnaire_invites').all()).results).toHaveLength(
    0,
  );
  const lost = fixture('lost');
  const response = await lost.call(`/admin/clients/${client.id}/questionnaires`, 'POST');
  expect(response.status).toBe(504);
  expect(await response.json()).toMatchObject({
    error: { code: 'email_outcome_unknown', retryable: false },
  });
  expect((await lost.call(`/questionnaire/${token(lost)}`)).status).toBe(200);
  expect((await env.DB.prepare('SELECT * FROM client_emails').all()).results).toHaveLength(0);
});
test('known acceptance with history failure preserves the invitation and reports manual reconciliation without retry', async () => {
  const f = fixture(),
    client = await prepare(f);
  await env.DB.exec(
    "CREATE TRIGGER fail_email_history BEFORE INSERT ON client_emails BEGIN SELECT RAISE(ABORT,'synthetic history failure'); END;",
  );
  const response = await f.call(`/admin/clients/${client.id}/questionnaires`, 'POST');
  expect(response.status).toBe(500);
  expect(await response.json()).toMatchObject({
    error: { code: 'email_history_failed', retryable: false },
  });
  expect(f.messages.length).toBe(1);
  expect((await f.call(`/questionnaire/${token(f)}`)).status).toBe(200);
  expect((await env.DB.prepare('SELECT * FROM client_emails').all()).results).toHaveLength(0);
});
test('invitation associations stay with their client and public links never expose other client activity', async () => {
  const f = fixture(),
    first = await prepare(f);
  const second = (await (
    await f.call('/admin/clients', 'POST', {
      firstName: 'Blake',
      lastName: 'Example',
      email: 'blake@example.invalid',
      shootType: 'newborn',
    })
  ).json()) as Client;
  const invite = (await (
    await f.call(`/admin/clients/${first.id}/questionnaires`, 'POST')
  ).json()) as QuestionnaireInvite;
  const secret = token(f);
  expect(
    ((await (await f.call(`/admin/clients/${second.id}`)).json()) as { questionnaires: unknown[] })
      .questionnaires,
  ).toEqual([]);
  await expect(getInvitation(env.DB, second.id, invite.id, new Date(clock))).rejects.toMatchObject({
    status: 404,
  });
  const publicData = await (await f.call(`/questionnaire/${secret}`)).json();
  expect(JSON.stringify(publicData).includes(second.email)).toBe(false);
  expect(JSON.stringify(publicData).includes(second.id)).toBe(false);
  expect((await f.call(`/questionnaire/${'z'.repeat(43)}`)).status).toBe(404);
});
test('a failed single-use commit rolls back both answers and claim so a deliberate retry can succeed', async () => {
  const f = fixture(),
    client = await prepare(f);
  await f.call(`/admin/clients/${client.id}/questionnaires`, 'POST');
  const secret = token(f);
  await env.DB.exec(
    "CREATE TRIGGER fail_questionnaire_claim BEFORE UPDATE ON questionnaire_invites BEGIN SELECT RAISE(ABORT,'synthetic claim failure'); END;",
  );
  expect(
    (await f.call(`/questionnaire/${secret}`, 'POST', { answers: { [question.id]: 'Garden' } }))
      .status,
  ).toBe(500);
  expect(
    (await env.DB.prepare('SELECT * FROM questionnaire_responses').all()).results,
  ).toHaveLength(0);
  expect(
    ((await (await f.call(`/questionnaire/${secret}`)).json()) as { status: string }).status,
  ).toBe('pending');
  await env.DB.exec('DROP TRIGGER fail_questionnaire_claim');
  expect(
    (await f.call(`/questionnaire/${secret}`, 'POST', { answers: { [question.id]: 'Garden' } }))
      .status,
  ).toBe(201);
});
