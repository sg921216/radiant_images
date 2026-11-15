import { z } from '../validation';
import { emailSchema, idSchema, isoTimeSchema, shootTypeSchema } from './common';
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' || value === undefined ? null : value), schema.nullable());
export const clientInputSchema = z.strictObject({
  firstName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[^\r\n\0]+$/),
  lastName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[^\r\n\0]+$/),
  email: emailSchema,
  phone: optional(
    z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^[+\d ().-]+$/),
  ),
  shootType: shootTypeSchema,
  sessionDate: optional(z.iso.date()),
  notes: z.string().trim().max(4000).default(''),
});
export const clientSchema = clientInputSchema.extend({ id: idSchema, createdAt: isoTimeSchema });
export type ClientInput = z.infer<typeof clientInputSchema>;
export type Client = z.infer<typeof clientSchema>;
