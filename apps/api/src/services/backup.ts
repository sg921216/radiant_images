import type { Env } from '../env';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';
import { hasQuestionnaireUrl } from '@radiant/shared';
import * as schema from '../db/schema';
import { sha256 } from './crypto';
import { ensureDeletionLedger, readDeletionLedger, reconcileDeletions } from './clientDeletion';
import { restoreMedia } from './mediaRecovery';
const DAY = 86400000;
export const BACKUP_MAX_BYTES = 16 * 1024 * 1024;
// Parent-first order; restore deletes in reverse order. Identifiers never come from a backup.
const tables = [
  schema.siteConfig,
  schema.pageContent,
  schema.faqEntries,
  schema.galleryImages,
  schema.banners,
  schema.pricingRevisions,
  schema.pricingPackages,
  schema.pricingPublication,
  schema.emailTemplates,
  schema.checklistItems,
  schema.questionnaireQuestions,
  schema.clients,
  schema.clientChecklistState,
  schema.questionnaireInvites,
  schema.questionnaireResponses,
  schema.clientEmails,
  schema.auditEvents,
].map((table) => ({
  name: getTableName(table),
  columns: Object.values(getTableColumns(table)).map((column) => column.name),
}));
const transient = [
  'sessions',
  'oauth_states',
  'exchange_codes',
  'inquiry_dedupe',
  'rate_limit_windows',
];
const cell = z.union([z.string(), z.number().finite(), z.null()]);
const documentSchema = z.strictObject({
  version: z.literal(1),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  ledgerId: z.string().regex(/^[a-f0-9]{32}$/),
  generation: z.number().int().nonnegative(),
  tables: z.record(z.string(), z.array(z.record(z.string(), cell))),
});
const envelopeSchema = z.strictObject({
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  snapshot: documentSchema,
});
export async function restoreStatus(env: Env) {
  const row = await env.DB.prepare(
    'SELECT restore_status AS status FROM lifecycle_state WHERE id=1',
  ).first<{ status: number }>();
  if (!row) throw new Error('lifecycle_state_missing');
  return row.status;
}
export async function createBackup(env: Env, now: Date): Promise<string> {
  if (await restoreStatus(env)) throw new Error('restore_in_progress');
  await ensureDeletionLedger(env);
  const ledger = await reconcileDeletions(env);
  const values = await env.DB.batch<Record<string, string | number | null>>(
    tables.map((table) =>
      env.DB.prepare(
        `SELECT ${table.columns.map((column) => `"${column}"`).join(',')} FROM "${table.name}"`,
      ),
    ),
  );
  const latest = await readDeletionLedger(env);
  if (latest.generation !== ledger.generation) throw new Error('deletion_during_backup');
  const snapshot = {
    version: 1 as const,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 28 * DAY).toISOString(),
    ledgerId: ledger.ledgerId,
    generation: ledger.generation,
    tables: Object.fromEntries(tables.map((table, index) => [table.name, values[index]!.results])),
  };
  for (const row of snapshot.tables.client_emails ?? [])
    if (
      [row.subject, row.body].some(
        (value) => typeof value === 'string' && hasQuestionnaireUrl(value, env.WEB_ORIGIN),
      )
    )
      throw new Error('backup_sensitive_history');
  const serialized = JSON.stringify(snapshot);
  const text = JSON.stringify({ sha256: await sha256(serialized), snapshot });
  if (new TextEncoder().encode(text).length > BACKUP_MAX_BYTES) throw new Error('backup_too_large');
  const key = `backups/${ulid(now.getTime())}.json`;
  await env.RECOVERY.put(key, text, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { createdAt: snapshot.createdAt, expiresAt: snapshot.expiresAt },
  });
  const saved = await env.RECOVERY.get(key);
  if (!saved || (await saved.text()) !== text) throw new Error('backup_verification_failed');
  return key;
}
export async function restoreBackup(env: Env, key: string, now: Date): Promise<void> {
  // No HTTP route calls this. Keep ingress detached during the operator-controlled restore.
  await env.DB.prepare('UPDATE lifecycle_state SET restore_status=1 WHERE id=1').run();
  if (!/^backups\/[0-9A-HJKMNP-TV-Z]{26}\.json$/.test(key)) throw new Error('invalid_backup_key');
  const object = await env.RECOVERY.get(key);
  if (!object || object.size > BACKUP_MAX_BYTES) throw new Error('backup_unavailable');
  const envelope = envelopeSchema.parse(await object.json());
  const snapshot = envelope.snapshot;
  if ((await sha256(JSON.stringify(snapshot))) !== envelope.sha256)
    throw new Error('backup_checksum_failed');
  const created = Date.parse(snapshot.createdAt),
    expires = Date.parse(snapshot.expiresAt);
  if (created > now.getTime() || expires !== created + 28 * DAY || now.getTime() >= expires)
    throw new Error('backup_expired');
  const ledger = await readDeletionLedger(env);
  if (ledger.ledgerId !== snapshot.ledgerId || ledger.generation < snapshot.generation)
    throw new Error('backup_ledger_mismatch');
  if (
    Object.keys(snapshot.tables).sort().join() !==
    tables
      .map((table) => table.name)
      .sort()
      .join()
  )
    throw new Error('backup_tables_invalid');
  for (const row of snapshot.tables.client_emails ?? [])
    if (
      [row.subject, row.body].some(
        (value) => typeof value === 'string' && hasQuestionnaireUrl(value, env.WEB_ORIGIN),
      )
    )
      throw new Error('backup_sensitive_history');
  for (const table of tables)
    for (const row of snapshot.tables[table.name]!) {
      if (Object.keys(row).sort().join() !== [...table.columns].sort().join())
        throw new Error('backup_columns_invalid');
    }
  const deleted = new Set(ledger.receipts.map((row) => row.clientId));
  snapshot.tables.clients = snapshot.tables.clients!.filter((row) => !deleted.has(String(row.id)));
  for (const name of ['client_emails', 'client_checklist_state', 'questionnaire_invites'])
    snapshot.tables[name] = snapshot.tables[name]!.filter(
      (row) => !deleted.has(String(row.client_id)),
    );
  const invites = new Set(snapshot.tables.questionnaire_invites!.map((row) => row.id));
  snapshot.tables.questionnaire_responses = snapshot.tables.questionnaire_responses!.filter((row) =>
    invites.has(row.invite_id),
  );
  for (const row of snapshot.tables.gallery_images!) await restoreMedia(env, String(row.id), now);
  const commands = [...transient, ...[...tables].reverse().map((table) => table.name)].map((name) =>
    env.DB.prepare(`DELETE FROM "${name}"`),
  );
  for (const table of tables)
    for (const row of snapshot.tables[table.name]!)
      commands.push(
        env.DB.prepare(
          `INSERT INTO "${table.name}" (${table.columns.map((column) => `"${column}"`).join(',')}) VALUES (${table.columns.map(() => '?').join(',')})`,
        ).bind(...table.columns.map((column) => row[column])),
      );
  await env.DB.batch(commands);
  await reconcileDeletions(env);
  await env.DB.prepare('UPDATE lifecycle_state SET restore_status=2 WHERE id=1').run();
}
export async function reopenAfterRestore(env: Env): Promise<void> {
  if ((await restoreStatus(env)) !== 2) throw new Error('restore_not_verified');
  await reconcileDeletions(env);
  await env.DB.prepare(
    'UPDATE lifecycle_state SET restore_status=0 WHERE id=1 AND restore_status=2',
  ).run();
}
