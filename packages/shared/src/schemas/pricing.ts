import { z } from '../validation';
import { packageSchema } from './content';
import { SHOOT_TYPES } from '../constants';
export const pricingDraftSchema = z
  .strictObject({
    packages: z
      .array(
        packageSchema
          .omit({ id: true })
          .extend({ id: z.string().optional(), sortOrder: z.number().int().min(0) }),
      )
      .min(3)
      .max(60),
  })
  .superRefine((draft, ctx) => {
    for (const type of SHOOT_TYPES) {
      const packages = draft.packages.filter((p) => p.shootType === type);
      if (!packages.length)
        ctx.addIssue({
          code: 'custom',
          path: ['packages'],
          message: `Add at least one ${type} package.`,
        });
      if (new Set(packages.map((p) => p.sortOrder)).size !== packages.length)
        ctx.addIssue({
          code: 'custom',
          path: ['packages'],
          message: `Each ${type} package needs a distinct order.`,
        });
    }
  });
export type PricingDraft = z.infer<typeof pricingDraftSchema>;
