import { z } from '../validation';
import { galleryTagSchema, idSchema } from './common';
export const altTextSchema = z
  .string()
  .trim()
  .min(1, 'Describe what is shown in the photograph.')
  .max(200, 'Use at most 200 characters.');
export const galleryUploadSchema = z.strictObject({
  tag: galleryTagSchema,
  altText: altTextSchema,
  width: z.coerce.number().int().min(1).max(2000),
  height: z.coerce.number().int().min(1).max(2000),
  originalMime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  originalBytes: z.coerce.number().int().min(1).max(10485760),
});
export const galleryEditSchema = z
  .strictObject({ tag: galleryTagSchema.optional(), altText: altTextSchema.optional() })
  .refine((value) => Object.keys(value).length > 0, 'Choose a tag or edit the description.');
export const orderSchema = z.strictObject({
  ids: z
    .array(idSchema)
    .max(60)
    .refine((ids) => new Set(ids).size === ids.length, 'Each image must appear once.'),
});
