import { ulid } from 'ulid';
import {
  galleryImageSchema,
  galleryUploadSchema,
  IMAGE_VARIANTS,
  LIMITS,
  imageHeader,
  type GalleryImage,
} from '@radiant/shared';
import type { Env } from '../env';
import type { Runtime } from './runtime';
import { InvalidImage, type ImageInputs, type VerifiedImages } from './imageProvider';
import { ApiFault, validate } from '../middleware/validate';
import { auditedMutation } from './mutation';
import { fallbackAudit } from './audit';
type GalleryRow = {
  id: string;
  tag: string;
  altText: string;
  sortOrder: number;
  width: number;
  height: number;
};
export const imageKeys = (id: string) => [
  `originals/${id}/source`,
  ...Object.keys(IMAGE_VARIANTS).map((variant) => `images/${id}/${variant}.webp`),
];
export function galleryView(env: Env, row: GalleryRow): GalleryImage {
  return galleryImageSchema.parse({
    ...row,
    urls: {
      full: `${env.API_ORIGIN}/images/${row.id}/full`,
      card: `${env.API_ORIGIN}/images/${row.id}/card`,
      thumb: `${env.API_ORIGIN}/images/${row.id}/thumb`,
    },
  });
}
export async function listGallery(env: Env) {
  return (
    await env.DB.prepare(
      'SELECT id,tag,alt_text AS altText,sort_order AS sortOrder,width,height FROM gallery_images ORDER BY sort_order',
    ).all<GalleryRow>()
  ).results.map((row) => galleryView(env, row));
}
export async function getGalleryImage(env: Env, id: string) {
  const row = await env.DB.prepare(
    'SELECT id,tag,alt_text AS altText,sort_order AS sortOrder,width,height FROM gallery_images WHERE id=?',
  )
    .bind(id)
    .first<GalleryRow>();
  if (!row) throw new ApiFault(404, 'not_found', 'This image was not found.');
  return galleryView(env, row);
}
function invalid(message: string, field = 'original'): never {
  throw new ApiFault(400, 'invalid_image', message, { [field]: message });
}
export async function uploadImage(
  env: Env,
  runtime: Runtime,
  form: FormData,
  actor: string,
  requestId: string,
) {
  const names = [
    'tag',
    'altText',
    'width',
    'height',
    'originalMime',
    'originalBytes',
    'original',
    'full',
    'card',
    'thumb',
  ];
  for (const key of form.keys())
    if (!names.includes(key) || form.getAll(key).length !== 1)
      invalid('The upload contains invalid fields.');
  const fields = validate(
    galleryUploadSchema,
    Object.fromEntries(names.slice(0, 6).map((name) => [name, form.get(name)])),
  );
  const input = {} as ImageInputs;
  for (const name of ['original', 'full', 'card', 'thumb'] as const) {
    const part = form.get(name);
    if (!(part instanceof File)) invalid('Choose a complete image upload.', name);
    const limit = name === 'original' ? LIMITS.originalBytes : IMAGE_VARIANTS[name].bytes;
    if (part.size > limit)
      throw new ApiFault(413, 'payload_too_large', 'An image exceeds its byte limit.');
    if (part.size === 0) invalid('The image is empty.', name);
    input[name] = new Uint8Array(await part.arrayBuffer());
  }
  try {
    const original = imageHeader(input.original);
    if (
      original.mime !== fields.originalMime ||
      input.original.length !== fields.originalBytes ||
      original.animated
    )
      invalid('The original image does not match its claimed format or size, or is animated.');
    for (const name of Object.keys(IMAGE_VARIANTS) as (keyof typeof IMAGE_VARIANTS)[]) {
      const info = imageHeader(input[name]);
      if (
        info.mime !== 'image/webp' ||
        info.animated ||
        info.hasMetadata ||
        Math.max(info.width, info.height) > IMAGE_VARIANTS[name].edge
      )
        invalid(
          'Public images must be static, metadata-free WebP files within the size limits.',
          name,
        );
      if (name === 'full' && (info.width !== fields.width || info.height !== fields.height))
        invalid('The image dimensions do not match.', name);
    }
  } catch (error) {
    if (error instanceof ApiFault) throw error;
    invalid('The image could not be validated.');
  }
  if (!runtime.validateImages)
    throw new ApiFault(
      500,
      'image_validation_unavailable',
      'Image validation is not configured. No image was published.',
    );
  let verified: VerifiedImages;
  try {
    verified = await runtime.validateImages(
      input,
      env.IMAGES && env.JPEG_VALIDATOR
        ? {
            images: env.IMAGES,
            validateJpeg: (bytes) => env.JPEG_VALIDATOR.getByName('portfolio').validate(bytes),
          }
        : undefined,
    );
  } catch (error) {
    if (error instanceof InvalidImage)
      invalid(
        'This photo is damaged or uses an unsupported format. Re-export it as JPEG or PNG and try again.',
      );
    throw new ApiFault(
      500,
      'image_validation_unavailable',
      'Image validation is unavailable. No image was published.',
    );
  }
  try {
    const source = imageHeader(input.original);
    if (
      verified.original.mime !== source.mime ||
      verified.original.width !== source.width ||
      verified.original.height !== source.height
    )
      invalid('The original image dimensions do not match.');
    for (const name of Object.keys(IMAGE_VARIANTS) as (keyof typeof IMAGE_VARIANTS)[]) {
      const output = verified[name];
      const info = imageHeader(output.bytes);
      if (
        info.mime !== 'image/webp' ||
        info.animated ||
        info.hasMetadata ||
        output.bytes.length > IMAGE_VARIANTS[name].bytes ||
        Math.max(info.width, info.height) > IMAGE_VARIANTS[name].edge ||
        info.width !== output.width ||
        info.height !== output.height
      )
        throw new Error('invalid_provider_output');
    }
    if (verified.full.width !== fields.width || verified.full.height !== fields.height)
      invalid('Prepared image dimensions do not match the decoded orientation.');
  } catch (error) {
    if (error instanceof ApiFault) throw error;
    throw new ApiFault(
      500,
      'image_validation_unavailable',
      'Image processing did not produce safe public images.',
    );
  }
  const id = ulid(),
    createdAt = runtime.now().toISOString(),
    keys = imageKeys(id);
  try {
    await env.MEDIA.put(keys[0]!, input.original, {
      httpMetadata: { contentType: fields.originalMime },
      customMetadata: { createdAt },
    });
    for (const name of Object.keys(IMAGE_VARIANTS) as (keyof typeof IMAGE_VARIANTS)[])
      await env.MEDIA.put(`images/${id}/${name}.webp`, verified[name].bytes, {
        httpMetadata: { contentType: 'image/webp' },
        customMetadata: { createdAt },
      });
    await auditedMutation(
      env.DB,
      [
        env.DB.prepare(
          'INSERT INTO gallery_images (id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height,created_at,updated_at) SELECT ?,?,?,COALESCE(MAX(sort_order)+1,0),?,?,?,?,?,?,?,? FROM gallery_images',
        ).bind(
          id,
          fields.tag,
          fields.altText,
          verified.full.width,
          verified.full.height,
          fields.originalMime,
          input.original.length,
          verified.original.width,
          verified.original.height,
          createdAt,
          createdAt,
        ),
      ],
      {
        actor,
        action: 'gallery.uploaded',
        entityType: 'image',
        entityId: id,
        outcome: 'ok',
        requestId,
      },
    );
  } catch (error) {
    try {
      await env.MEDIA.delete(keys);
    } catch {
      try {
        await env.RECOVERY.put(`media-cleanup/${id}.json`, JSON.stringify({ id, keys, createdAt }));
      } catch {
        fallbackAudit(
          { action: 'gallery.cleanup', outcome: 'error', requestId },
          'cleanup_journal_failed',
        );
      }
    }
    if (error instanceof Error && error.message.includes('gallery_full'))
      throw new ApiFault(
        409,
        'gallery_full',
        'The gallery already has 60 images. Remove one before uploading.',
      );
    throw error;
  }
  return getGalleryImage(env, id);
}
export async function deleteImage(
  env: Env,
  runtime: Runtime,
  id: string,
  actor: string,
  requestId: string,
) {
  const row = await env.DB.prepare('SELECT * FROM gallery_images WHERE id=?').bind(id).first();
  if (!row) throw new ApiFault(404, 'not_found', 'This image was not found.');
  const keys = imageKeys(id);
  const backups = [] as { key: string; bytes: ArrayBuffer; contentType: string }[];
  const createdAt = runtime.now().toISOString();
  for (const key of keys) {
    const object = await env.MEDIA.get(key);
    if (!object)
      throw new ApiFault(
        500,
        'image_recovery_unavailable',
        'The image could not be safely removed.',
      );
    const entry = {
      key,
      bytes: await object.arrayBuffer(),
      contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
    };
    backups.push(entry);
    await env.RECOVERY.put(
      `media-recovery/${id}/${key.startsWith('originals/') ? 'original' : key.split('/').at(-1)}`,
      entry.bytes,
      { httpMetadata: { contentType: entry.contentType }, customMetadata: { createdAt } },
    );
  }
  await env.RECOVERY.put(
    `media-recovery/${id}/manifest.json`,
    JSON.stringify({
      id,
      row,
      keys,
      createdAt,
      expiresAt: new Date(runtime.now().getTime() + 28 * 86400000).toISOString(),
    }),
  );
  try {
    await env.MEDIA.delete(keys);
    await auditedMutation(
      env.DB,
      [env.DB.prepare('DELETE FROM gallery_images WHERE id=?').bind(id)],
      {
        actor,
        action: 'gallery.deleted',
        entityType: 'image',
        entityId: id,
        outcome: 'ok',
        requestId,
      },
    );
  } catch (error) {
    for (const backup of backups) {
      try {
        await env.MEDIA.put(backup.key, backup.bytes, {
          httpMetadata: { contentType: backup.contentType },
          customMetadata: { createdAt },
        });
      } catch {
        fallbackAudit(
          { action: 'gallery.restore', outcome: 'error', requestId },
          'media_restore_failed',
        );
      }
    }
    throw error;
  }
}
