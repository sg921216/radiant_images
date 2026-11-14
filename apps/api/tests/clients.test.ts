import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { createApp } from './helpers/app';
import { ownerHeaders } from './helpers/owner';
import { seedLocalDatabase } from '../src/db/seedData';
import type { Env } from '../src/env';
import { readDeletionLedger, DELETION_HEAD } from '../src/services/clientDeletion';
const now = () => new Date('2026-11-13T12:00:00Z');
const app = () => createApp({ now, fetch: async () => new Response('', { status: 503 }) });
let headers: Record<string, string>;
beforeEach(async () => {
  await seedLocalDatabase(env.DB, true);
  headers = await ownerHeaders(env);
});
const client = {
  firstName: 'Avery',
  lastName: 'Example',
  email: 'avery@example.invalid',
  shootType: 'family',
  notes: 'Synthetic manual entry',
};
const call = (path: string, method = 'GET', body?: unknown, bindings: Env = env) =>
  app().request(
    path,
    { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
    bindings,
  );
const ids = [
  '01K00000000000000000000001',
  '01K00000000000000000000002',
  '01K00000000000000000000003',
];
async function existing() {
  await env.DB.batch(
    ids
      .slice(0, 2)
      .map((id, index) =>
        env.DB.prepare(
          "INSERT INTO clients (id,first_name,last_name,email,shoot_type) VALUES (?,'Synthetic',?,'synthetic@example.invalid','family')",
        ).bind(id, String(index)),
      ),
  );
}
test('manual client create/search/edit returns explicit empty activity and validates input', async () => {
  const response = await call('/admin/clients', 'POST', client);
  expect(response.status).toBe(201);
  const created = (await response.json()) as { id: string };
  const detail = await call(`/admin/clients/${created.id}`);
  expect(await detail.json()).toMatchObject({
    ...client,
    phone: null,
    sessionDate: null,
    emails: [],
    checklist: [],
    questionnaires: [],
  });
  expect((await (await call('/admin/clients?q=avery')).json()) as unknown[]).toHaveLength(1);
  expect(await (await call('/admin/clients?q=%27%20OR%201%3D1--')).json()).toEqual([]);
  expect(
    (
      await call(`/admin/clients/${created.id}`, 'PUT', {
        ...client,
        notes: 'Updated manually',
        phone: '+1 555 123 4567',
      })
    ).status,
  ).toBe(200);
  expect((await call('/admin/clients', 'POST', { ...client, email: 'bad' })).status).toBe(400);
  expect(
    (await call('/admin/clients', 'POST', { ...client, importInquiryId: 'forbidden' })).status,
  ).toBe(400);
});

test('long and wildcard-looking client searches stay literal within the accepted 200-character limit', async () => {
  const name = 'A'.repeat(80);
  const created = await call('/admin/clients', 'POST', {
    ...client,
    firstName: name,
    lastName: 'Literal_%!',
  });
  expect(created.status).toBe(201);
  for (const query of [name.toLowerCase(), 'Literal_%!', '_%!']) {
    const result = await call('/admin/clients?q=' + encodeURIComponent(query));
    expect(result.status).toBe(200);
    expect(await result.json()).toHaveLength(1);
  }
  const absent = await call('/admin/clients?q=' + encodeURIComponent('B'.repeat(200)));
  expect(absent.status).toBe(200);
  expect(await absent.json()).toEqual([]);
});
test('checklist master propagates atomically while preserving each client state through rename, reorder and repeated saves', async () => {
  await existing();
  const first = [
    { id: ids[0], label: 'Planning', sortOrder: 0 },
    { id: ids[1], label: 'Session', sortOrder: 1 },
  ];
  expect((await call('/admin/checklist', 'PUT', first)).status).toBe(200);
  expect(
    (await call(`/admin/clients/${ids[0]}/checklist/${ids[0]}`, 'PUT', { completed: true })).status,
  ).toBe(200);
  const next = [
    { id: ids[2], label: 'Delivery', sortOrder: 0 },
    { id: ids[0], label: 'Plan together', sortOrder: 1 },
  ];
  for (let repeat = 0; repeat < 2; repeat++)
    expect((await call('/admin/checklist', 'PUT', next)).status).toBe(200);
  for (const [index, id] of ids.slice(0, 2).entries()) {
    const detail = (await (await call(`/admin/clients/${id}`)).json()) as {
      checklist: { itemId: string; label: string; completedAt: string | null }[];
    };
    expect(detail.checklist).toEqual([
      { itemId: ids[2], label: 'Delivery', completedAt: null },
      {
        itemId: ids[0],
        label: 'Plan together',
        completedAt: index === 0 ? now().toISOString() : null,
      },
    ]);
  }
  expect((await env.DB.prepare('SELECT * FROM client_checklist_state').all()).results).toHaveLength(
    4,
  );
  const created = await call('/admin/clients', 'POST', client);
  expect(created.status).toBe(201);
  const id = ((await created.json()) as { id: string }).id;
  expect(
    (
      (await (await call(`/admin/clients/${id}`)).json()) as {
        checklist: { completedAt: string | null }[];
      }
    ).checklist.map((item) => item.completedAt),
  ).toEqual([null, null]);
});
test('a failed master propagation restores the master and every client state', async () => {
  await existing();
  const original = [{ id: ids[0], label: 'Planning', sortOrder: 0 }];
  expect((await call('/admin/checklist', 'PUT', original)).status).toBe(200);
  await call(`/admin/clients/${ids[0]}/checklist/${ids[0]}`, 'PUT', { completed: true });
  const before = (
    await env.DB.prepare('SELECT * FROM client_checklist_state ORDER BY client_id').all()
  ).results;
  await env.DB.exec(
    "CREATE TRIGGER fail_checklist_state BEFORE INSERT ON client_checklist_state WHEN NEW.item_id='01K00000000000000000000002' BEGIN SELECT RAISE(ABORT,'synthetic propagation failure'); END;",
  );
  expect(
    (
      await call('/admin/checklist', 'PUT', [
        ...original,
        { id: ids[1], label: 'Delivery', sortOrder: 1 },
      ])
    ).status,
  ).toBe(500);
  expect(await (await call('/admin/checklist')).json()).toEqual(original);
  expect(
    (await env.DB.prepare('SELECT * FROM client_checklist_state ORDER BY client_id').all()).results,
  ).toEqual(before);
});
test('client deletion requires a durable ID/time-only receipt, cascades and is safely retryable after interruption', async () => {
  const response = await call('/admin/clients', 'POST', client);
  expect(response.status).toBe(201);
  const { id } = (await response.json()) as { id: string };
  await call('/admin/checklist', 'PUT', [{ id: ids[0], label: 'Planning', sortOrder: 0 }]);
  const broken = new Proxy(env.RECOVERY, {
    get(target, key) {
      if (key === 'put')
        return () => {
          throw new Error('synthetic receipt failure');
        };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  expect(
    (await call(`/admin/clients/${id}`, 'DELETE', undefined, { ...env, RECOVERY: broken })).status,
  ).toBe(500);
  expect((await call(`/admin/clients/${id}`)).status).toBe(200);
  await env.DB.exec(
    "CREATE TRIGGER fail_client_delete BEFORE DELETE ON clients BEGIN SELECT RAISE(ABORT,'synthetic interruption'); END;",
  );
  expect((await call(`/admin/clients/${id}`, 'DELETE')).status).toBe(500);
  const receipt = await env.RECOVERY.get(`client-deletions/${id}.json`);
  expect(receipt).not.toBeNull();
  expect(await receipt!.json()).toEqual({ clientId: id, deletedAt: now().toISOString() });
  await env.DB.exec('DROP TRIGGER fail_client_delete');
  expect((await call(`/admin/clients/${id}`, 'DELETE')).status).toBe(204);
  expect((await call(`/admin/clients/${id}`)).status).toBe(404);
  expect((await env.DB.prepare('SELECT * FROM client_checklist_state').all()).results).toHaveLength(
    0,
  );
  expect((await call(`/admin/clients/${id}`, 'DELETE')).status).toBe(204);
});
test('template replacements preserve retained references and reject unknown placeholders or pasted questionnaire URLs', async () => {
  const template = {
    id: ids[0],
    name: 'Welcome',
    subject: 'Hello {{firstName}}',
    body: 'Your {{shootType}} session: {{questionnaireLink}}',
    sortOrder: 0,
  };
  expect((await call('/admin/templates', 'PUT', [template])).status).toBe(200);
  expect(await (await call('/admin/templates')).json()).toEqual([template]);
  for (const changes of [
    { subject: '{{unknown}}' },
    { body: `Open ${env.WEB_ORIGIN}/q/${'a'.repeat(43)}` },
  ])
    expect((await call('/admin/templates', 'PUT', [{ ...template, ...changes }])).status).toBe(400);
  expect(await (await call('/admin/templates')).json()).toEqual([template]);
  expect((await call('/admin/templates', 'PUT', [])).status).toBe(200);
  expect(await (await call('/admin/templates')).json()).toEqual([]);
});
test('concurrent deletions preserve both ledger entries; missing receipts or ledger fail closed', async () => {
  const first = (await (await call('/admin/clients', 'POST', client)).json()) as { id: string };
  const second = (await (
    await call('/admin/clients', 'POST', { ...client, firstName: 'Blake' })
  ).json()) as { id: string };
  const responses = await Promise.all([
    call(`/admin/clients/${first.id}`, 'DELETE'),
    call(`/admin/clients/${second.id}`, 'DELETE'),
  ]);
  expect(responses.map((response) => response.status)).toEqual([204, 204]);
  const ledger = await readDeletionLedger(env);
  expect(ledger.receipts.map((receipt) => receipt.clientId).sort()).toEqual(
    [first.id, second.id].sort(),
  );
  await env.RECOVERY.delete(`client-deletions/${first.id}.json`);
  await expect(readDeletionLedger(env)).rejects.toThrow();
  await env.RECOVERY.delete(DELETION_HEAD);
  expect((await call('/admin/clients', 'POST', client)).status).toBe(500);
  expect(await env.RECOVERY.head(DELETION_HEAD)).toBeNull();
});
test('retained template IDs keep sent-email associations through name swaps', async () => {
  await existing();
  const a = { id: ids[0], name: 'First', subject: 'One', body: 'Synthetic message', sortOrder: 0 },
    b = { ...a, id: ids[1], name: 'Second', sortOrder: 1 };
  expect((await call('/admin/templates', 'PUT', [a, b])).status).toBe(200);
  await env.DB.prepare(
    "INSERT INTO client_emails (id,client_id,template_id,subject,body,gmail_message_id,sent_at) VALUES (?,?,?,'Synthetic subject','Synthetic body','synthetic',?)",
  )
    .bind(ids[2], ids[0], ids[0], now().toISOString())
    .run();
  expect(
    (
      await call('/admin/templates', 'PUT', [
        { ...a, name: 'Second' },
        { ...b, name: 'First' },
      ])
    ).status,
  ).toBe(200);
  expect(
    (await env.DB.prepare('SELECT template_id FROM client_emails').first<{ template_id: string }>())
      ?.template_id,
  ).toBe(ids[0]);
  expect((await call('/admin/templates', 'PUT', [b])).status).toBe(200);
  expect(
    (
      await env.DB.prepare('SELECT template_id FROM client_emails').first<{
        template_id: string | null;
      }>()
    )?.template_id,
  ).toBeNull();
});
