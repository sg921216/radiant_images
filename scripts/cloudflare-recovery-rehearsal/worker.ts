import type { Env } from '../../apps/api/src/env';
import type { Runtime } from '../../apps/api/src/services/runtime';
import seed from '../../apps/api/src/db/local-seed.json';
import { createApp } from '../../apps/api/src/index';
import {
  createBackup,
  restoreBackup,
  reopenAfterRestore,
  restoreStatus,
} from '../../apps/api/src/services/backup';
import {
  deleteClient,
  readDeletionLedger,
  reconcileDeletions,
} from '../../apps/api/src/services/clientDeletion';
import { deleteImage, imageKeys } from '../../apps/api/src/services/images';
import { runScheduled, scheduled } from '../../apps/api/src/scheduled';
import { ScheduledOperations } from '../../apps/api/src/services/scheduledOperations';
import { sha256 } from '../../apps/api/src/services/crypto';

// Disposable, private operator entry only. Never included by the application entry point.
// Its config has no public routes; a loopback proxy reaches it via a service binding.
const DAY = 86_400_000;
const controlKey = 'rehearsal/control.json';
const ids = [
  '01K00000000000000000000001',
  '01K00000000000000000000002',
  '01K00000000000000000000003',
  '01K00000000000000000000004',
];
type Control = { phase: string; at: string; key?: string; cron: boolean };
class CheckFailure extends Error {}
function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new CheckFailure(label);
}
async function rejected(action: () => Promise<unknown>, label: string) {
  let failed = false;
  try {
    await action();
  } catch {
    failed = true;
  }
  check(failed, label);
}
const runtime = (now: Date): Runtime => ({
  now: () => now,
  // Explicit synthetic provider boundary: never sends mail or contacts Google.
  fetch: async (input) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token')
      return Response.json({ access_token: 'synthetic-rehearsal' });
    if (url === 'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs')
      return Response.json({
        sendAs: [{ sendAsEmail: 'owner@example.invalid', verificationStatus: 'accepted' }],
      });
    throw new CheckFailure('unexpected_provider_request');
  },
});
const fixtureEnv = (env: Env): Env => ({
  ...env,
  GOOGLE_CLIENT_ID: 'synthetic',
  GOOGLE_CLIENT_SECRET: 'synthetic',
  GMAIL_REFRESH_TOKEN: 'synthetic',
});
// The same production serialization and RPC dispatch, with only the external mail
// provider and rehearsal control/receipt injected inside the private coordinator.
export class RehearsalScheduledOperations extends ScheduledOperations {
  protected override async execute(cron: string): Promise<void> {
    const state = await control(this.env);
    if (!state.cron) return;
    await runScheduled(cron, fixtureEnv(this.env), runtime(new Date()));
    await this.env.RECOVERY.put(
      'rehearsal/cron.json',
      JSON.stringify({
        delegatedSchedule: cron,
        completedAt: new Date().toISOString(),
        provider: 'synthetic-no-send',
      }),
    );
  }
}
async function control(env: Env) {
  const value = await env.RECOVERY.get(controlKey);
  check(value && value.size < 2048, 'control_missing');
  return value.json<Control>();
}
async function save(env: Env, value: Control) {
  await env.RECOVERY.put(controlKey, JSON.stringify(value));
}
async function count(env: Env, sql: string, ...values: string[]) {
  return (await env.DB.prepare(sql)
    .bind(...values)
    .first<{ count: number }>())!.count;
}
async function appStatus(env: Env) {
  return (await createApp().request('/public/bootstrap', {}, env)).status;
}
async function seedFixture(env: Env) {
  check(!(await env.RECOVERY.head(controlKey)), 'already_initialized');
  check(!(await env.DB.prepare('SELECT id FROM clients LIMIT 1').first()), 'database_not_empty');
  const now = new Date();
  await env.DB.batch(seed.map((row) => env.DB.prepare(row.sql).bind(...row.values)));
  const statements = [
    env.DB.prepare(
      "INSERT INTO checklist_items(id,label,sort_order) VALUES (?,'Synthetic recovery checklist',0)",
    ).bind(ids[0]),
    env.DB.prepare(
      "INSERT INTO clients(id,first_name,last_name,email,shoot_type) VALUES (?,'Synthetic','Deleted','deleted@example.invalid','family'),(?,'Synthetic','Retained','retained@example.invalid','family')",
    ).bind(ids[0], ids[1]),
  ];
  for (const [index, client] of [ids[0]!, ids[1]!].entries()) {
    const invite = ids[index + 2]!;
    statements.push(
      env.DB.prepare(
        "INSERT INTO questionnaire_invites(id,client_id,token_hash,questions_snapshot,sent_at,expires_at) VALUES (?,?,?,'[]',?,?)",
      ).bind(
        invite,
        client,
        await sha256(`synthetic-${index}`),
        now.toISOString(),
        new Date(now.getTime() + 30 * DAY).toISOString(),
      ),
      env.DB.prepare(
        "INSERT INTO questionnaire_responses(invite_id,answers,submitted_at) VALUES (?,'{}',?)",
      ).bind(invite, now.toISOString()),
      env.DB.prepare(
        "INSERT INTO client_emails(id,client_id,questionnaire_invite_id,subject,body,gmail_message_id,sent_at) VALUES (?,?,?,'Synthetic','[questionnaire link omitted]','synthetic',?)",
      ).bind(client, client, invite, now.toISOString()),
      env.DB.prepare(
        'INSERT INTO client_checklist_state(client_id,item_id,completed_at) SELECT ?,id,? FROM checklist_items',
      ).bind(client, now.toISOString()),
    );
  }
  statements.push(
    env.DB.prepare(
      "INSERT INTO gallery_images(id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height) VALUES (?,'general','Synthetic recovery fixture',0,1,1,'image/png',3,1,1)",
    ).bind(ids[2]),
    env.DB.prepare(
      "INSERT INTO sessions(id,token_hash,owner_email,last_seen_at,absolute_expires_at,created_at) VALUES (?,?,'owner@example.invalid',?,?,?)",
    ).bind(
      ids[0],
      'b'.repeat(64),
      new Date(0).toISOString(),
      new Date(0).toISOString(),
      new Date(0).toISOString(),
    ),
    env.DB.prepare(
      "INSERT INTO exchange_codes(code_hash,owner_email,expires_at) VALUES (?,'owner@example.invalid',?)",
    ).bind('c'.repeat(64), new Date(0).toISOString()),
    env.DB.prepare('INSERT INTO inquiry_dedupe(hash,expires_at) VALUES (?,?)').bind(
      'd'.repeat(64),
      new Date(0).toISOString(),
    ),
  );
  await env.DB.batch(statements);
  for (const table of [
    'client_checklist_state',
    'client_emails',
    'questionnaire_invites',
    'questionnaire_responses',
  ])
    check(
      (await count(env, `SELECT COUNT(*) AS count FROM ${table}`)) === 2,
      'dependent_fixture_missing',
    );
  for (const [index, key] of imageKeys(ids[2]!).entries())
    await env.MEDIA.put(key, new Uint8Array([1, 2, index]), {
      httpMetadata: { contentType: index ? 'image/webp' : 'image/png' },
      customMetadata: { createdAt: now.toISOString() },
    });
  await save(env, { phase: 'seed', at: now.toISOString(), cron: false });
}
const next: Record<string, string> = {
  backup: 'seed',
  delete: 'backup',
  restore: 'delete',
  unsafe: 'restore',
  retention: 'unsafe',
  retry: 'retention',
  healthy: 'retry',
};
async function execute(action: string, env: Env) {
  if (action === 'seed') {
    await seedFixture(env);
    return;
  }
  const state = await control(env);
  if (next[action]) check(state.phase === next[action], 'phase_order');
  const now = new Date(state.at);
  if (action === 'backup') {
    state.key = await createBackup(env, now);
    const snapshot = await (await env.RECOVERY.get(state.key))!.text();
    check(
      ![
        'sessions',
        'oauth_states',
        'exchange_codes',
        'inquiry_dedupe',
        'rate_limit_windows',
        'lifecycle_state',
      ].some((t) => snapshot.includes(`"${t}"`)),
      'transient_backup',
    );
    check(
      snapshot.includes('[questionnaire link omitted]') && !snapshot.includes('/q/'),
      'backup_history',
    );
  } else if (action === 'delete') {
    await deleteClient(env, ids[0]!, now, 'owner@example.invalid', 'synthetic');
    await deleteImage(env, runtime(now), ids[2]!, 'owner@example.invalid', 'synthetic');
    for (const table of [
      'clients',
      'client_emails',
      'client_checklist_state',
      'questionnaire_invites',
    ])
      check(
        (await count(
          env,
          `SELECT COUNT(*) AS count FROM ${table} WHERE ${table === 'clients' ? 'id' : 'client_id'}=?`,
          ids[0]!,
        )) === 0,
        'live_cascade',
      );
    check(
      (await count(
        env,
        'SELECT COUNT(*) AS count FROM questionnaire_responses WHERE invite_id=?',
        ids[2]!,
      )) === 0,
      'response_cascade',
    );
    check((await env.MEDIA.list()).objects.length === 0, 'media_deleted');
    await env.DB.prepare("UPDATE clients SET notes='After backup'").run();
  } else if (action === 'restore') {
    await restoreBackup(env, state.key!, new Date(now.getTime() + DAY));
    check((await appStatus(env)) === 503, 'restore_closed');
    check(
      (await count(env, 'SELECT COUNT(*) AS count FROM clients WHERE id=?', ids[0]!)) === 0,
      'deleted_client_restored',
    );
    for (const table of ['client_emails', 'client_checklist_state', 'questionnaire_invites'])
      check(
        (await count(env, `SELECT COUNT(*) AS count FROM ${table} WHERE client_id=?`, ids[0]!)) ===
          0,
        'deleted_dependents_restored',
      );
    check(
      (await count(
        env,
        'SELECT COUNT(*) AS count FROM questionnaire_responses WHERE invite_id=?',
        ids[2]!,
      )) === 0,
      'deleted_response_restored',
    );
    const retained = await env.DB.prepare('SELECT notes FROM clients WHERE id=?')
      .bind(ids[1])
      .first<{ notes: string }>();
    check(retained?.notes === '', 'retained_snapshot');
    const history = await env.DB.prepare(
      'SELECT body,questionnaire_invite_id FROM client_emails',
    ).first<{ body: string; questionnaire_invite_id: string }>();
    check(
      history?.body === '[questionnaire link omitted]' &&
        history.questionnaire_invite_id === ids[3],
      'history_association',
    );
    for (const [index, key] of imageKeys(ids[2]!).entries()) {
      const obj = await env.MEDIA.get(key);
      check(
        obj && Array.from(new Uint8Array(await obj.arrayBuffer())).join() === [1, 2, index].join(),
        'media_bytes',
      );
    }
    check((await count(env, 'SELECT COUNT(*) AS count FROM sessions')) === 0, 'sessions_restored');
    await reopenAfterRestore(env);
    check((await appStatus(env)) === 200, 'reopen');
  } else if (action === 'unsafe') {
    const receiptKey = `client-deletions/${ids[0]}.json`;
    const receipt = await (await env.RECOVERY.get(receiptKey))!.text();
    await env.RECOVERY.delete(receiptKey);
    await rejected(() => restoreBackup(env, state.key!, now), 'missing_ledger_accepted');
    await rejected(() => reopenAfterRestore(env), 'unsafe_reopen');
    check((await appStatus(env)) === 503, 'unsafe_access');
    await env.RECOVERY.put(receiptKey, receipt);
    await rejected(
      () => restoreBackup(env, state.key!, new Date(now.getTime() + 28 * DAY)),
      'expiry_accepted',
    );
    check((await restoreStatus(env)) === 1, 'expiry_not_closed');
    await restoreBackup(env, state.key!, now);
    await reopenAfterRestore(env);
  } else if (action === 'retention') {
    const broken = new Proxy(env.RECOVERY, {
      get(target, key) {
        if (key === 'delete')
          return async () => {
            throw new Error('synthetic_delete_outage');
          };
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    await rejected(
      () =>
        runScheduled(
          '*/5 * * * *',
          { ...env, RECOVERY: broken },
          runtime(new Date(now.getTime() + 32 * DAY)),
        ),
      'cleanup_outage_accepted',
    );
    check(await env.RECOVERY.head(state.key!), 'backup_lost_during_outage');
    check((await readDeletionLedger(env)).receipts.length === 1, 'receipt_lost_during_outage');
    const status = await (await env.RECOVERY.get('operations/maintenance.json'))!.json<{
      status: string;
    }>();
    check(status.status === 'error', 'cleanup_error_not_signaled');
  } else if (action === 'retry') {
    await runScheduled('*/5 * * * *', env, runtime(new Date(now.getTime() + 32 * DAY)));
    check(!(await env.RECOVERY.head(state.key!)), 'expired_backup_remaining');
    check(
      (await env.RECOVERY.list({ prefix: 'media-recovery/' })).objects.length === 0,
      'expired_media_remaining',
    );
    check((await readDeletionLedger(env)).receipts.length === 0, 'receipt_not_retired');
    check(!(await env.RECOVERY.head(`client-deletions/${ids[0]}.json`)), 'receipt_remaining');
  } else if (action === 'healthy') {
    await runScheduled('0 3 * * *', fixtureEnv(env), runtime(new Date()));
  } else if (action === 'cron-on') {
    state.cron = true;
  } else if (action === 'cron-off') {
    state.cron = false;
  } else if (action === 'stale') {
    state.cron = false;
    const old = new Date(Date.now() - 32 * DAY).toISOString();
    await env.RECOVERY.put(
      'operations/maintenance.json',
      JSON.stringify({ version: 1, status: 'ok', startedAt: old, finishedAt: old }),
    );
    await env.RECOVERY.put('backups/01K00000000000000000000999.json', '{}', {
      customMetadata: {
        createdAt: old,
        expiresAt: new Date(Date.parse(old) + 28 * DAY).toISOString(),
      },
    });
  } else if (action === 'recover-monitor') {
    await runScheduled('0 3 * * *', fixtureEnv(env), runtime(new Date()));
  } else if (action === 'checklist-proof') {
    check(!state.cron, 'pause_cron_first');
    const deleted = '01K00000000000000000000011';
    const retained = '01K00000000000000000000012';
    const item = '01K00000000000000000000013';
    const at = new Date();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO clients(id,first_name,last_name,email,shoot_type) VALUES (?,'Synthetic','Deleted','deleted@example.invalid','family'),(?,'Synthetic','Retained','retained@example.invalid','family')",
      ).bind(deleted, retained),
      env.DB.prepare(
        "INSERT INTO checklist_items(id,label,sort_order) VALUES (?,'Synthetic checklist cascade proof',1)",
      ).bind(item),
      env.DB.prepare(
        'INSERT INTO client_checklist_state(client_id,item_id,completed_at) VALUES (?,?,?),(?,?,?)',
      ).bind(deleted, item, at.toISOString(), retained, item, at.toISOString()),
    ]);
    check(
      (await count(
        env,
        'SELECT COUNT(*) AS count FROM client_checklist_state WHERE item_id=?',
        item,
      )) === 2,
      'checklist_fixture_missing',
    );
    const key = await createBackup(env, at);
    await deleteClient(env, deleted, at, 'owner@example.invalid', 'synthetic');
    check(
      (await count(
        env,
        'SELECT COUNT(*) AS count FROM client_checklist_state WHERE client_id=?',
        deleted,
      )) === 0,
      'checklist_live_cascade',
    );
    await restoreBackup(env, key, at);
    check((await appStatus(env)) === 503, 'checklist_restore_open');
    check(
      (await count(
        env,
        'SELECT COUNT(*) AS count FROM client_checklist_state WHERE client_id=?',
        deleted,
      )) === 0,
      'checklist_restore_resurrected',
    );
    const saved = await env.DB.prepare(
      'SELECT completed_at FROM client_checklist_state WHERE client_id=? AND item_id=?',
    )
      .bind(retained, item)
      .first<{ completed_at: string }>();
    check(saved?.completed_at === at.toISOString(), 'retained_checklist_changed');
    await reopenAfterRestore(env);
    await deleteClient(env, retained, at, 'owner@example.invalid', 'synthetic');
  } else if (action === 'provider-delete') {
    check(!state.cron, 'pause_cron_first');
    await deleteClient(env, ids[1]!, new Date(), 'owner@example.invalid', 'synthetic');
    check(
      (await count(env, 'SELECT COUNT(*) AS count FROM clients WHERE id=?', ids[1]!)) === 0,
      'provider_delete',
    );
  } else if (action === 'provider-reconcile') {
    check(!state.cron && state.phase === 'provider-delete', 'provider_phase');
    // Ingress remains detached: Time Travel can restore an earlier lifecycle_state.
    await env.DB.prepare('UPDATE lifecycle_state SET restore_status=1 WHERE id=1').run();
    check((await appStatus(env)) === 503, 'provider_restore_open');
    check(
      (await count(env, 'SELECT COUNT(*) AS count FROM clients WHERE id=?', ids[1]!)) === 1,
      'provider_point_not_restored',
    );
    const ledger = await readDeletionLedger(env);
    check(
      ledger.receipts.some((receipt) => receipt.clientId === ids[1]),
      'provider_receipt_missing',
    );
    await reconcileDeletions(env);
    await env.DB.batch(
      ['sessions', 'oauth_states', 'exchange_codes', 'inquiry_dedupe', 'rate_limit_windows'].map(
        (table) => env.DB.prepare(`DELETE FROM ${table}`),
      ),
    );
    for (const table of [
      'clients',
      'client_emails',
      'client_checklist_state',
      'questionnaire_invites',
    ])
      check(
        (await count(
          env,
          `SELECT COUNT(*) AS count FROM ${table} WHERE ${table === 'clients' ? 'id' : 'client_id'}=?`,
          ids[1]!,
        )) === 0,
        'provider_cascade',
      );
    check(
      (await count(
        env,
        'SELECT COUNT(*) AS count FROM questionnaire_responses WHERE invite_id=?',
        ids[3]!,
      )) === 0,
      'provider_response',
    );
    await env.DB.prepare('UPDATE lifecycle_state SET restore_status=2 WHERE id=1').run();
    await reopenAfterRestore(env);
    check((await appStatus(env)) === 200, 'provider_reopen');
  }
  state.phase = action;
  await save(env, state);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const action = new URL(request.url).pathname.slice(1);
    if (
      request.method !== 'POST' ||
      ![
        'seed',
        ...Object.keys(next),
        'cron-on',
        'cron-off',
        'stale',
        'recover-monitor',
        'provider-delete',
        'provider-reconcile',
        'checklist-proof',
      ].includes(action)
    )
      return new Response(null, { status: 404 });
    try {
      await execute(action, env);
      return Response.json({ ok: true, action });
    } catch (error) {
      return Response.json(
        {
          ok: false,
          action,
          issue: error instanceof CheckFailure ? error.message : 'rehearsal_failed',
        },
        { status: 500 },
      );
    }
  },
  async scheduled(event: ScheduledController, env: Env): Promise<void> {
    // Accelerate the daily branch, keeping the front Worker on the shipped dispatch path.
    await scheduled({ ...event, cron: '0 3 * * *' }, env);
  },
};
