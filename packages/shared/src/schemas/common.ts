import { z } from '../validation';
import { SHOOT_TYPES, GALLERY_TAGS } from '../constants';
export const idSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Choose a valid identifier.');
export const shootTypeSchema = z.enum(SHOOT_TYPES);
export const galleryTagSchema = z.enum(GALLERY_TAGS);
export const emailSchema = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .email()
  .refine((value) => !/[\r\n]/.test(value));
export const isoTimeSchema = z.iso.datetime({ offset: true });
export const moneySchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Choose a valid timezone.');
export const errorSchema = z.strictObject({
  error: z
    .strictObject({
      code: z.string(),
      message: z.string(),
      fields: z.record(z.string(), z.string()).optional(),
      retryable: z.boolean().optional(),
    })
    .superRefine((error, ctx) => {
      const expected: Record<string, boolean> = {
        email_not_sent: true,
        email_outcome_unknown: false,
        email_history_failed: false,
      };
      if (error.code in expected && error.retryable !== expected[error.code])
        ctx.addIssue({
          code: 'custom',
          path: ['retryable'],
          message: 'Invalid delivery retry state.',
        });
    }),
});
export type ApiErrorBody = z.infer<typeof errorSchema>;
export type ShootType = z.infer<typeof shootTypeSchema>;
