import { z } from 'zod';
import { idSchema, isoTimeSchema } from '@radiant/shared';
import type { Env } from '../env';
import { ApiFault } from '../middleware/validate';
import { auditedMutation } from './mutation';
const receiptSchema = z.strictObject({ clientId: idSchema, deletedAt: isoTimeSchema });
const ledgerSchema = z.strictObject({
  ledgerId: z.string().regex(/^[a-f0-9]{32}$/),
  generation: z.number().int().min(0),
  receipts: z.array(receiptSchema),
  retiring: z.array(receiptSchema).default([]),
});
export const DELETION_HEAD = 'client-deletion-ledger/head.json';
export type DeletionReceipt = z.infer<typeof receiptSchema>;
export type DeletionLedger = z.infer<typeof ledgerSchema>;
function unavailable(): never {
  throw new ApiFault(
    500,
    'deletion_ledger_unavailable',
    'Recovery records are unavailable. The operation could not be completed.',
  );
}
async function state(env: Env) {
  const row = await env.DB.prepare(
    'SELECT ledger_id AS ledgerId,initialized FROM lifecycle_state WHERE id=1',
  ).first<{ ledgerId: string; initialized: number }>();
  if (!row) unavailable();
  return row;
}
async function readHead(env: Env, ledgerId: string) {
  const object = await env.RECOVERY.get(DELETION_HEAD);
  if (!object) unavailable();
  const data = ledgerSchema.parse(await object.json());
  if (data.ledgerId !== ledgerId) unavailable();
  return { data, etag: object.etag };
}
export async function ensureDeletionLedger(env: Env) {
  const current = await state(env);
  if (!current.initialized) {
    const existing = await env.RECOVERY.get(DELETION_HEAD);
    if (!existing) {
      const old = await env.RECOVERY.list({ prefix: 'client-deletions/', limit: 1 });
      if (old.objects.length) unavailable();
      await env.RECOVERY.put(
        DELETION_HEAD,
        JSON.stringify({ ledgerId: current.ledgerId, generation: 0, receipts: [] }),
        { onlyIf: { etagDoesNotMatch: '*' } },
      );
    }
    await readHead(env, current.ledgerId);
    await env.DB.prepare('UPDATE lifecycle_state SET initialized=1 WHERE id=1 AND ledger_id=?')
      .bind(current.ledgerId)
      .run();
  }
  return readHead(env, current.ledgerId);
}
export async function readDeletionLedger(env: Env): Promise<DeletionLedger> {
  const current = await state(env);
  if (!current.initialized) unavailable();
  const { data } = await readHead(env, current.ledgerId);
  const expected = new Set([...data.receipts, ...data.retiring].map((receipt) => receipt.clientId));
  if (expected.size !== data.receipts.length + data.retiring.length) unavailable();
  for (const receipt of data.receipts) {
    const object = await env.RECOVERY.get(`client-deletions/${receipt.clientId}.json`);
    if (!object) unavailable();
    const value = receiptSchema.parse(await object.json());
    if (value.clientId !== receipt.clientId || value.deletedAt !== receipt.deletedAt) unavailable();
  }
  let cursor: string | undefined;
  do {
    const page = await env.RECOVERY.list({
      prefix: 'client-deletions/',
      ...(cursor ? { cursor } : {}),
    });
    for (const object of page.objects) {
      const match = /^client-deletions\/([0-9A-HJKMNP-TV-Z]{26})\.json$/.exec(object.key);
      if (!match || !expected.has(match[1]!)) unavailable();
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return data;
}
export async function reconcileDeletions(env: Env) {
  const current = await ensureDeletionLedger(env);
  const indexed = new Set(
    [...current.data.receipts, ...current.data.retiring].map((row) => row.clientId),
  );
  let cursor: string | undefined;
  do {
    const page = await env.RECOVERY.list({
      prefix: 'client-deletions/',
      ...(cursor ? { cursor } : {}),
    });
    for (const item of page.objects) {
      const object = await env.RECOVERY.get(item.key);
      if (!object) unavailable();
      const receipt = receiptSchema.parse(await object.json());
      if (item.key !== `client-deletions/${receipt.clientId}.json`) unavailable();
      if (!indexed.has(receipt.clientId))
        await recordClientDeletion(env, receipt.clientId, receipt.deletedAt);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const ledger = await readDeletionLedger(env);
  if (ledger.receipts.length)
    await env.DB.batch(
      ledger.receipts.map((row) =>
        env.DB.prepare('DELETE FROM clients WHERE id=?').bind(row.clientId),
      ),
    );
  return ledger;
}
// Call only after overdue recovery copies have been removed and verified absent.
export async function expireDeletionReceipts(env: Env, now: Date) {
  const verified = await readDeletionLedger(env);
  for (let attempt = 0; attempt < 8; attempt++) {
    const head = await readHead(env, verified.ledgerId);
    const expired = head.data.receipts.filter(
      (row) => now.getTime() - Date.parse(row.deletedAt) >= 31 * 86400000,
    );
    const retiring = [...head.data.retiring, ...expired];
    if (!retiring.length) return;
    const ids = new Set(retiring.map((row) => row.clientId));
    const next = {
      ...head.data,
      generation: head.data.generation + 1,
      receipts: head.data.receipts.filter((row) => !ids.has(row.clientId)),
      retiring,
    };
    const saved = await env.RECOVERY.put(DELETION_HEAD, JSON.stringify(next), {
      onlyIf: { etagMatches: head.etag },
    });
    if (!saved) continue;
    for (const row of retiring) {
      const key = `client-deletions/${row.clientId}.json`;
      await env.RECOVERY.delete(key);
      if (await env.RECOVERY.head(key)) unavailable();
    }
    // Concurrent new deletions must be retained. A failed CAS leaves a resumable retirement list.
    const latest = await readHead(env, verified.ledgerId);
    const result = await env.RECOVERY.put(
      DELETION_HEAD,
      JSON.stringify({
        ...latest.data,
        generation: latest.data.generation + 1,
        retiring: latest.data.retiring.filter((row) => !ids.has(row.clientId)),
      }),
      { onlyIf: { etagMatches: latest.etag } },
    );
    if (result) return;
  }
  unavailable();
}
export async function recordClientDeletion(env: Env, clientId: string, deletedAt: string) {
  const initial = await ensureDeletionLedger(env);
  const key = `client-deletions/${clientId}.json`;
  let object = await env.RECOVERY.get(key);
  if (!object) {
    await env.RECOVERY.put(key, JSON.stringify({ clientId, deletedAt }), {
      onlyIf: { etagDoesNotMatch: '*' },
    });
    object = await env.RECOVERY.get(key);
  }
  if (!object) unavailable();
  const receipt = receiptSchema.parse(await object.json());
  if (receipt.clientId !== clientId) unavailable();
  for (let attempt = 0; attempt < 8; attempt++) {
    const head = await readHead(env, initial.data.ledgerId);
    const previous = head.data.receipts.find((row) => row.clientId === clientId);
    if (previous) {
      if (previous.deletedAt !== receipt.deletedAt) unavailable();
      return receipt;
    }
    const next = {
      ...head.data,
      generation: head.data.generation + 1,
      receipts: [...head.data.receipts, receipt],
    };
    const result = await env.RECOVERY.put(DELETION_HEAD, JSON.stringify(next), {
      onlyIf: { etagMatches: head.etag },
    });
    if (result) return receipt;
  }
  unavailable();
}
export async function deleteClient(
  env: Env,
  clientId: string,
  now: Date,
  actor: string,
  requestId: string,
) {
  const exists = await env.DB.prepare('SELECT id FROM clients WHERE id=?').bind(clientId).first();
  if (!exists && !(await env.RECOVERY.head(`client-deletions/${clientId}.json`)))
    throw new ApiFault(404, 'not_found', 'This client was not found.');
  await recordClientDeletion(env, clientId, now.toISOString());
  await auditedMutation(env.DB, [env.DB.prepare('DELETE FROM clients WHERE id=?').bind(clientId)], {
    actor,
    action: 'client.deleted',
    entityType: 'client',
    entityId: clientId,
    outcome: 'ok',
    requestId,
  });
}
