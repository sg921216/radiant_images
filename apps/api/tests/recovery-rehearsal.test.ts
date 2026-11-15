import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import rehearsal from '../../../scripts/cloudflare-recovery-rehearsal/worker';

test('private rehearsal exercises recovery and returns assertions without client payloads', async () => {
  for (const action of [
    'seed',
    'backup',
    'delete',
    'restore',
    'unsafe',
    'retention',
    'retry',
    'healthy',
    'checklist-proof',
  ]) {
    const response = await rehearsal.fetch(
      new Request(`https://recovery.invalid/${action}`, { method: 'POST' }),
      env,
    );
    const result = await response.text();
    expect(response.status, `${action}: ${result}`).toBe(200);
    expect(JSON.parse(result), action).toMatchObject({ ok: true, action });
    if (action === 'seed') {
      for (const table of [
        'client_checklist_state',
        'client_emails',
        'questionnaire_invites',
        'questionnaire_responses',
      ])
        expect(
          (
            await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{
              count: number;
            }>()
          )?.count,
          table,
        ).toBe(2);
    }
    expect(result).not.toContain('@');
    expect(result).not.toContain('backups/');
  }
});

test('rehearsal rejects unknown actions and mutation via GET', async () => {
  expect((await rehearsal.fetch(new Request('https://recovery.invalid/seed'), env)).status).toBe(
    404,
  );
  expect(
    (await rehearsal.fetch(new Request('https://recovery.invalid/sql', { method: 'POST' }), env))
      .status,
  ).toBe(404);
});

test('provider rollback reconciliation keeps deleted data offline until the independent ledger is replayed', async () => {
  for (const action of ['seed', 'backup', 'provider-delete']) {
    const response = await rehearsal.fetch(
      new Request(`https://recovery.invalid/${action}`, { method: 'POST' }),
      env,
    );
    expect(response.status, action).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, action });
  }
  // Local simulation of D1 Time Travel; a separate remote command supplies the live proof.
  await env.DB.prepare(
    "INSERT INTO clients(id,first_name,last_name,email,shoot_type) VALUES ('01K00000000000000000000002','Synthetic','Retained','retained@example.invalid','family')",
  ).run();
  const response = await rehearsal.fetch(
    new Request('https://recovery.invalid/provider-reconcile', { method: 'POST' }),
    env,
  );
  expect(await response.json()).toMatchObject({ ok: true, action: 'provider-reconcile' });
  expect(
    await env.DB.prepare("SELECT id FROM clients WHERE id='01K00000000000000000000002'").first(),
  ).toBeNull();
});
