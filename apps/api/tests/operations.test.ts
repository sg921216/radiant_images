import { env } from 'cloudflare:workers';
import { beforeEach, expect, test } from 'vitest';
import { seedLocalDatabase } from '../src/db/seedData';
import { createBackup, restoreBackup, reopenAfterRestore } from '../src/services/backup';
import { deleteClient, DELETION_HEAD, readDeletionLedger } from '../src/services/clientDeletion';
import { maintain, healthSignal } from '../src/scheduled';
import type { Env } from '../src/env';
import { imageKeys, deleteImage } from '../src/services/images';
import { restoreMedia } from '../src/services/mediaRecovery';
import { createApp } from './helpers/app';
import { sha256 } from '../src/services/crypto';
const now = new Date('2026-11-14T12:00:00Z');
const later = (days: number) => new Date(now.getTime() + days * 86400000);
const ids = [
  '01K00000000000000000000001',
  '01K00000000000000000000002',
  '01K00000000000000000000003',
];
beforeEach(async () => {
  await seedLocalDatabase(env.DB, true);
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO clients(id,first_name,last_name,email,shoot_type) VALUES (?,'Synthetic','Deleted','private@example.invalid','family'),(?,'Synthetic','Retained','retained@example.invalid','family')",
    ).bind(ids[0], ids[1]),
    env.DB.prepare(
      "INSERT INTO questionnaire_invites(id,client_id,token_hash,questions_snapshot,sent_at,expires_at) VALUES (?,?,?,'[]',?,?)",
    ).bind(
      ids[2],
      ids[1],
      await sha256('a'.repeat(43)),
      now.toISOString(),
      later(30).toISOString(),
    ),
    env.DB.prepare(
      "INSERT INTO client_emails(id,client_id,questionnaire_invite_id,subject,body,gmail_message_id,sent_at) VALUES (?,?,?,'Synthetic','[questionnaire link omitted]','synthetic',?)",
    ).bind(ids[0], ids[1], ids[2], now.toISOString()),
    env.DB.prepare(
      'INSERT INTO exchange_codes(code_hash,owner_email,expires_at) VALUES (?,?,?)',
    ).bind('b'.repeat(64), 'owner@example.invalid', later(-1).toISOString()),
    env.DB.prepare('INSERT INTO inquiry_dedupe(hash,expires_at) VALUES (?,?)').bind(
      'c'.repeat(64),
      later(-1).toISOString(),
    ),
  ]);
});
test('private backup excludes transient state and restore replays independent deletion receipts before reopening', async () => {
  const key = await createBackup(env, now);
  const object = await env.RECOVERY.get(key);
  expect(object).not.toBeNull();
  const text = await object!.text();
  expect(text.includes('exchange_codes')).toBe(false);
  expect(text.includes('inquiry_dedupe')).toBe(false);
  expect(text.includes('a'.repeat(43))).toBe(false);
  expect(text).toContain('[questionnaire link omitted]');
  await deleteClient(env, ids[0]!, now, 'owner@example.invalid', 'synthetic');
  await env.DB.prepare("UPDATE clients SET notes='After backup'").run();
  await restoreBackup(env, key, later(1));
  expect((await createApp().request('/public/bootstrap', {}, env)).status).toBe(503);
  expect(await env.DB.prepare('SELECT id FROM clients WHERE id=?').bind(ids[0]).first()).toBeNull();
  expect(await env.DB.prepare('SELECT notes FROM clients WHERE id=?').bind(ids[1]).first()).toEqual(
    { notes: '' },
  );
  expect(
    await env.DB.prepare('SELECT body,questionnaire_invite_id FROM client_emails').first(),
  ).toEqual({ body: '[questionnaire link omitted]', questionnaire_invite_id: ids[2] });
  expect((await readDeletionLedger(env)).receipts).toHaveLength(1);
  await reopenAfterRestore(env);
  expect((await createApp().request('/public/bootstrap', {}, env)).status).toBe(200);
});

test('new backups stop when combined media and recovery storage has no safe headroom', async () => {
  const media = new Proxy(env.MEDIA, {
    get: (target, key) =>
      key === 'list'
        ? async () => ({ objects: [{ size: 5 * 1024 ** 3 }], truncated: false })
        : typeof Reflect.get(target, key) === 'function'
          ? Reflect.get(target, key).bind(target)
          : Reflect.get(target, key),
  });
  const recovery = new Proxy(env.RECOVERY, {
    get: (target, key) =>
      key === 'list'
        ? async (options?: R2ListOptions) =>
            options?.prefix
              ? target.list(options)
              : { objects: [{ size: 1024 ** 3 }], truncated: false }
        : typeof Reflect.get(target, key) === 'function'
          ? Reflect.get(target, key).bind(target)
          : Reflect.get(target, key),
  });
  await expect(createBackup({ ...env, MEDIA: media, RECOVERY: recovery }, now)).rejects.toThrow(
    'storage_capacity_unavailable',
  );
  expect((await env.RECOVERY.list({ prefix: 'backups/' })).objects).toHaveLength(0);
});
test('missing or incomplete independent ledger blocks restore and public access', async () => {
  const key = await createBackup(env, now);
  await deleteClient(env, ids[0]!, now, 'owner@example.invalid', 'synthetic');
  await env.RECOVERY.delete(`client-deletions/${ids[0]}.json`);
  await expect(restoreBackup(env, key, later(1))).rejects.toThrow();
  await expect(reopenAfterRestore(env)).rejects.toThrow();
  expect((await createApp().request('/public/bootstrap', {}, env)).status).toBe(503);
  await env.RECOVERY.delete(DELETION_HEAD);
  await expect(createBackup(env, later(1))).rejects.toThrow();
});
test('expired or corrupted copies cannot be restored and a failed import stays offline', async () => {
  const key = await createBackup(env, now);
  await expect(restoreBackup(env, key, later(30))).rejects.toThrow();
  expect((await createApp().request('/public/bootstrap', {}, env)).status).toBe(503);
  // The original private copy is untouched by a rejected restore.
  expect(await env.RECOVERY.head(key)).not.toBeNull();
});
test('maintenance removes expired transient state and recovery copies while retaining receipts for 31 days', async () => {
  const key = await createBackup(env, now);
  await deleteClient(env, ids[0]!, now, 'owner@example.invalid', 'synthetic');
  const runtime = { now: () => later(28), fetch: async () => new Response('', { status: 503 }) };
  await maintain(env, runtime);
  expect(await env.RECOVERY.head(key)).toBeNull();
  expect((await env.DB.prepare('SELECT * FROM exchange_codes').all()).results).toHaveLength(0);
  expect((await env.DB.prepare('SELECT * FROM inquiry_dedupe').all()).results).toHaveLength(0);
  expect((await readDeletionLedger(env)).receipts).toHaveLength(1);
  await maintain(env, { ...runtime, now: () => later(31) });
  expect((await readDeletionLedger(env)).receipts).toHaveLength(0);
  expect(await env.RECOVERY.head(`client-deletions/${ids[0]}.json`)).toBeNull();
});
test('backups reject token-bearing email history before writing any recovery copy', async () => {
  await env.DB.prepare('UPDATE client_emails SET body=?')
    .bind(`Open ${env.WEB_ORIGIN}/q/${'x'.repeat(43)}`)
    .run();
  await expect(createBackup(env, now)).rejects.toThrow('backup_sensitive_history');
  expect((await env.RECOVERY.list({ prefix: 'backups/' })).objects).toHaveLength(0);
});
test('corrupt backups and failed atomic imports preserve existing rows and keep access closed', async () => {
  const key = await createBackup(env, now);
  const object = await env.RECOVERY.get(key);
  const original = await object!.text();
  const data = JSON.parse(original) as { sha256: string };
  data.sha256 = '0'.repeat(64);
  await env.RECOVERY.put(key, JSON.stringify(data));
  await expect(restoreBackup(env, key, later(1))).rejects.toThrow('backup_checksum_failed');
  await expect(reopenAfterRestore(env)).rejects.toThrow('restore_not_verified');
  await env.RECOVERY.put(key, original);
  await env.DB.prepare("UPDATE clients SET notes='Preserve on failure'").run();
  await env.DB.exec(
    "CREATE TRIGGER fail_import BEFORE INSERT ON clients BEGIN SELECT RAISE(ABORT,'synthetic import failure'); END;",
  );
  await expect(restoreBackup(env, key, later(1))).rejects.toThrow();
  expect((await env.DB.prepare('SELECT DISTINCT notes FROM clients').all()).results).toEqual([
    { notes: 'Preserve on failure' },
  ]);
  await expect(reopenAfterRestore(env)).rejects.toThrow();
});
test('cleanup storage failure preserves deletion receipts and retries safely', async () => {
  const key = await createBackup(env, now);
  await deleteClient(env, ids[0]!, now, 'owner@example.invalid', 'synthetic');
  const broken = new Proxy(env.RECOVERY, {
    get(target, key) {
      if (key === 'delete')
        return async () => {
          throw new Error('synthetic outage');
        };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const runtime = { now: () => later(31), fetch: async () => new Response('', { status: 503 }) };
  await expect(maintain({ ...env, RECOVERY: broken } as Env, runtime)).rejects.toThrow();
  expect(await env.RECOVERY.head(key)).not.toBeNull();
  expect((await readDeletionLedger(env)).receipts).toHaveLength(1);
  await maintain(env, runtime);
  expect((await readDeletionLedger(env)).receipts).toHaveLength(0);
});
test('original and all three variants recover privately; staged orphans and expired copies are removed', async () => {
  const id = ids[2]!;
  await env.DB.prepare(
    "INSERT INTO gallery_images(id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height) VALUES (?,'general','Synthetic recovery fixture',0,1,1,'image/png',3,1,1)",
  )
    .bind(id)
    .run();
  for (const [index, key] of imageKeys(id).entries())
    await env.MEDIA.put(key, new Uint8Array([1, 2, index]), {
      httpMetadata: { contentType: index ? 'image/webp' : 'image/png' },
      customMetadata: { createdAt: now.toISOString() },
    });
  const backup = await createBackup(env, now);
  const runtime = { now: () => now, fetch: async () => new Response('', { status: 503 }) };
  await deleteImage(env, runtime, id, 'owner@example.invalid', 'synthetic');
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
  await restoreBackup(env, backup, later(1));
  for (const [index, key] of imageKeys(id).entries())
    expect(Array.from(new Uint8Array(await (await env.MEDIA.get(key))!.arrayBuffer()))).toEqual([
      1,
      2,
      index,
    ]);
  await reopenAfterRestore(env);
  await env.MEDIA.put(`images/${ids[0]}/full.webp`, 'synthetic orphan', {
    customMetadata: { createdAt: now.toISOString() },
  });
  await maintain(env, { ...runtime, now: () => later(28) });
  expect((await env.RECOVERY.list({ prefix: 'media-recovery/' })).objects).toHaveLength(0);
  expect((await env.MEDIA.list()).objects).toHaveLength(4);
  await env.MEDIA.delete(imageKeys(id));
  await expect(restoreMedia(env, id, later(28))).rejects.toThrow();
});
test('health signal reports only bounded status and failure counts without contacting mail-send', async () => {
  await env.DB.prepare(
    "INSERT INTO audit_events(id,actor,action,outcome,request_id,detail,at) VALUES (?,'private@example.invalid','inquiry.failed','error','synthetic','{}',?)",
  )
    .bind(ids[0], now.toISOString())
    .run();
  const endpoints: string[] = [];
  const result = await healthSignal(env, {
    now: () => now,
    fetch: async (input) => {
      const url = String(input);
      endpoints.push(url);
      return Response.json(
        url.includes('oauth2')
          ? { access_token: 'synthetic' }
          : { sendAs: [{ sendAsEmail: 'owner@example.invalid', verificationStatus: 'accepted' }] },
      );
    },
  });
  expect(result).toEqual({
    at: now.toISOString(),
    gmail: 'verified',
    failures: { inquiry: 1, auth: 0, image: 0 },
  });
  expect(endpoints.every((url) => !url.includes('messages/send'))).toBe(true);
  expect(JSON.stringify(result).includes('@')).toBe(false);
});
