import type { Env } from './env';
import type { Runtime } from './services/runtime';
import { productionRuntime } from './services/runtime';
import { createBackup, restoreStatus } from './services/backup';
import { expireDeletionReceipts, reconcileDeletions } from './services/clientDeletion';
import { allObjects, maintainMedia, removeVerified } from './services/mediaRecovery';
import { senderVerification } from './services/email';
import { fallbackAudit } from './services/audit';
export async function maintain(env: Env, runtime: Runtime): Promise<void> {
  if (await restoreStatus(env)) throw new Error('restore_in_progress');
  const now = runtime.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE absolute_expires_at<=? OR last_seen_at<=?').bind(
      now.toISOString(),
      new Date(now.getTime() - 86400000).toISOString(),
    ),
    ...['oauth_states', 'exchange_codes', 'inquiry_dedupe'].map((table) =>
      env.DB.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(now.toISOString()),
    ),
    env.DB.prepare('DELETE FROM rate_limit_windows WHERE expires_at<=?').bind(
      Math.floor(now.getTime() / 1000),
    ),
  ]);
  await reconcileDeletions(env);
  for (const object of await allObjects(env.RECOVERY, 'backups/')) {
    const expires = Date.parse(object.customMetadata?.expiresAt ?? '');
    if (!Number.isFinite(expires)) throw new Error('backup_expiry_missing');
    if (now.getTime() >= expires) await removeVerified(env.RECOVERY, [object.key]);
  }
  await maintainMedia(env, now);
  await expireDeletionReceipts(env, now);
}
export async function healthSignal(env: Env, runtime: Runtime) {
  const config = await env.DB.prepare('SELECT sender_address FROM site_config WHERE id=1').first<{
    sender_address: string;
  }>();
  const gmail = config
    ? await senderVerification(env, runtime, config.sender_address)
    : 'unavailable';
  const failures = (
    await env.DB.prepare(
      "SELECT action,COUNT(*) AS count FROM audit_events WHERE outcome='error' AND at>=? GROUP BY action",
    )
      .bind(new Date(runtime.now().getTime() - 86400000).toISOString())
      .all<{ action: string; count: number }>()
  ).results;
  const counts: Record<string, number> = { inquiry: 0, auth: 0, image: 0 };
  for (const row of failures) {
    const group = row.action.startsWith('inquiry.')
      ? 'inquiry'
      : row.action.startsWith('auth.')
        ? 'auth'
        : row.action.startsWith('gallery.')
          ? 'image'
          : null;
    if (group) counts[group] = (counts[group] ?? 0) + row.count;
  }
  const value = { at: runtime.now().toISOString(), gmail, failures: counts };
  await env.RECOVERY.put('health/latest.json', JSON.stringify(value), {
    httpMetadata: { contentType: 'application/json' },
  });
  if (gmail !== 'verified')
    fallbackAudit(
      { action: 'health.gmail', outcome: 'error', requestId: crypto.randomUUID() },
      'gmail_unavailable',
    );
  return value;
}
export async function scheduled(event: ScheduledController, env: Env): Promise<void> {
  try {
    await maintain(env, productionRuntime);
    if (event.cron === '0 3 * * *') {
      await createBackup(env, productionRuntime.now());
      await healthSignal(env, productionRuntime);
    }
  } catch {
    fallbackAudit(
      { action: 'operations.failed', outcome: 'error', requestId: crypto.randomUUID() },
      'maintenance_failed',
    );
    throw new Error('maintenance_failed');
  }
}
