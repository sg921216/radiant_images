import { z } from '../validation';
import {
  emailSchema,
  galleryTagSchema,
  idSchema,
  isoTimeSchema,
  moneySchema,
  shootTypeSchema,
  timezoneSchema,
} from './common';
export const optionListSchema = z
  .array(z.string().trim().min(1).max(80))
  .min(1)
  .max(20)
  .refine((values) => new Set(values).size === values.length, 'Remove duplicate options.');
export const publicConfigSchema = z.strictObject({
  shootLocations: optionListSchema,
  referralSources: optionListSchema,
  timezone: timezoneSchema,
  publicContactEmail: emailSchema,
});
export const galleryImageSchema = z.strictObject({
  id: idSchema,
  tag: galleryTagSchema,
  altText: z.string().trim().min(1).max(200),
  sortOrder: z.number().int(),
  width: z.number().int().min(1).max(2000),
  height: z.number().int().min(1).max(2000),
  urls: z.strictObject({ full: z.url(), card: z.url(), thumb: z.url() }),
});
export const bannerSchema = z.strictObject({
  id: idSchema,
  message: z.string().min(1).max(200),
  linkUrl: z.url().nullable(),
  startsAt: isoTimeSchema,
  endsAt: isoTimeSchema,
});
export const packageSchema = z.strictObject({
  id: idSchema,
  shootType: shootTypeSchema,
  sortOrder: z.number().int(),
  name: z.string().trim().min(1).max(60),
  priceCents: moneySchema,
  description: z.string().max(500),
  inclusions: z.array(z.string().min(1).max(120)).min(1).max(15),
});
export const pricingRevisionSchema = z.strictObject({
  revisionId: idSchema,
  publishedAt: isoTimeSchema,
  packages: z.array(packageSchema),
});
export const pageSchema = z.strictObject({
  page: z.enum(['about', 'maternity', 'newborn', 'family']),
  introMd: z.string().max(4000),
  howItWorks: z
    .array(z.strictObject({ title: z.string().max(80), body: z.string().max(600) }))
    .max(8),
});
export const faqSchema = z.strictObject({
  id: idSchema,
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(2000),
  sortOrder: z.number().int(),
});
export const bootstrapSchema = z.strictObject({
  banner: bannerSchema.nullable(),
  config: publicConfigSchema,
  gallery: z.array(galleryImageSchema),
  pages: z.array(pageSchema),
  faq: z.array(faqSchema),
  pricing: pricingRevisionSchema,
});
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type PricingRevision = z.infer<typeof pricingRevisionSchema>;
export type PublicBootstrap = z.infer<typeof bootstrapSchema>;
