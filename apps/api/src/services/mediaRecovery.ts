import { z } from 'zod';
import { idSchema, isoTimeSchema } from '@radiant/shared';
import type { Env } from '../env';
import { imageKeys } from './images';
const manifestSchema = z.object({
  id: idSchema,
  createdAt: isoTimeSchema,
  expiresAt: isoTimeSchema,
});
export async function allObjects(bucket: R2Bucket, prefix: string) {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({
      prefix,
      include: ['customMetadata'],
      ...(cursor ? { cursor } : {}),
    });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}
export async function removeVerified(bucket: R2Bucket, keys: string[]) {
  for (const key of keys) {
    await bucket.delete(key);
    if (await bucket.head(key)) throw new Error('recovery_delete_failed');
  }
}
export async function restoreMedia(env: Env, id: string, now: Date) {
  idSchema.parse(id);
  const missing: string[] = [];
  for (const key of imageKeys(id)) if (!(await env.MEDIA.head(key))) missing.push(key);
  if (!missing.length) return;
  const manifest = await env.RECOVERY.get(`media-recovery/${id}/manifest.json`);
  if (!manifest) throw new Error('media_recovery_missing');
  const value = manifestSchema.parse(await manifest.json());
  if (
    value.id !== id ||
    now.getTime() >= Date.parse(value.expiresAt) ||
    Date.parse(value.expiresAt) - Date.parse(value.createdAt) > 28 * 86400000
  )
    throw new Error('media_recovery_expired');
  for (const key of missing) {
    const object = await env.RECOVERY.get(
      `media-recovery/${id}/${key.startsWith('originals/') ? 'original' : key.split('/').at(-1)}`,
    );
    if (!object) throw new Error('media_recovery_incomplete');
    await env.MEDIA.put(key, object.body, {
      ...(object.httpMetadata ? { httpMetadata: object.httpMetadata } : {}),
      customMetadata: { createdAt: now.toISOString() },
    });
    if (!(await env.MEDIA.head(key))) throw new Error('media_restore_failed');
  }
}
export async function maintainMedia(env: Env, now: Date) {
  const published = new Set(
    (await env.DB.prepare('SELECT id FROM gallery_images').all<{ id: string }>()).results.map(
      (row) => row.id,
    ),
  );
  for (const object of await allObjects(env.RECOVERY, 'media-recovery/'))
    if (object.key.endsWith('/manifest.json')) {
      const manifest = await env.RECOVERY.get(object.key);
      if (!manifest) continue;
      const data = manifestSchema.parse(await manifest.json());
      if (published.has(data.id)) await restoreMedia(env, data.id, now);
      if (now.getTime() >= Date.parse(data.expiresAt))
        await removeVerified(
          env.RECOVERY,
          (await allObjects(env.RECOVERY, `media-recovery/${data.id}/`)).map((row) => row.key),
        );
    }
  for (const object of await allObjects(env.RECOVERY, 'media-cleanup/')) {
    const match = /^media-cleanup\/([0-9A-HJKMNP-TV-Z]{26})\.json$/.exec(object.key);
    if (!match) throw new Error('invalid_media_journal');
    if (!published.has(match[1]!)) await removeVerified(env.MEDIA, imageKeys(match[1]!));
    await removeVerified(env.RECOVERY, [object.key]);
  }
  // An hour protects in-flight staging. Unknown keys fail closed instead of becoming public.
  for (const prefix of ['originals/', 'images/'])
    for (const object of await allObjects(env.MEDIA, prefix)) {
      const id = object.key.split('/')[1];
      const createdAt = object.customMetadata?.createdAt;
      if (
        id &&
        !published.has(id) &&
        now.getTime() - Date.parse(createdAt ?? object.uploaded.toISOString()) >= 3600000
      ) {
        // Recheck immediately before cleanup in case publication completed during enumeration.
        if (!(await env.DB.prepare('SELECT id FROM gallery_images WHERE id=?').bind(id).first()))
          await removeVerified(env.MEDIA, [object.key]);
      }
    }
  // Also remove partial private copies whose manifest write was interrupted.
  for (const object of await allObjects(env.RECOVERY, 'media-recovery/'))
    if (
      !object.key.endsWith('/manifest.json') &&
      now.getTime() -
        Date.parse(object.customMetadata?.createdAt ?? object.uploaded.toISOString()) >=
        28 * 86400000
    )
      await removeVerified(env.RECOVERY, [object.key]);
}
