import { z } from '../validation';
import { idSchema, isoTimeSchema } from './common';
export const checklistItemSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0),
});
export const checklistSchema = z
  .array(checklistItemSchema)
  .max(60)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    'Remove duplicate item IDs.',
  )
  .refine(
    (items) => new Set(items.map((item) => item.sortOrder)).size === items.length,
    'Use distinct display positions.',
  );
export const checklistStateSchema = z.strictObject({
  itemId: idSchema,
  label: z.string(),
  completedAt: isoTimeSchema.nullable(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type ChecklistState = z.infer<typeof checklistStateSchema>;
