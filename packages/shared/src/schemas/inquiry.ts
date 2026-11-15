import { z } from '../validation';
import type { PublicConfig } from './content';
import { emailSchema, shootTypeSchema } from './common';
const blank = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());
export function inquiryDateBounds(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (name: string) => Number(parts.find((p) => p.type === name)?.value);
  const year = part('year'),
    month = part('month'),
    day = part('day');
  const end = new Date(Date.UTC(year, month - 1 + 18, 1));
  end.setUTCDate(
    Math.min(day, new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()),
  );
  return {
    min: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    max: end.toISOString().slice(0, 10),
  };
}
export const inquirySchema = (config: PublicConfig, now: Date) => {
  const bounds = inquiryDateBounds(config.timezone, now);
  return z
    .strictObject({
      firstName: z.string().trim().min(1, 'Enter your first name.').max(80),
      lastName: z.string().trim().min(1, 'Enter your last name.').max(80),
      email: emailSchema,
      contactMethod: z.enum(['email', 'call', 'text']),
      shootType: shootTypeSchema,
      phone: optional(
        z
          .string()
          .trim()
          .min(7)
          .max(20)
          .regex(/^[+\d ().-]+$/, 'Enter a valid phone number.'),
      ),
      postalCode: optional(z.string().trim().min(3).max(12)),
      preferredDay: optional(
        z.iso
          .date()
          .refine(
            (day) => day >= bounds.min && day <= bounds.max,
            `Choose a date from ${bounds.min} through ${bounds.max}.`,
          ),
      ),
      specialRequests: optional(z.string().trim().max(2000)),
      message: optional(z.string().trim().max(2000)),
      sessionLengthHours: optional(z.number().int().min(1).max(4)),
      numberOfPeople: optional(z.number().int().min(1).max(12)),
      shootLocation: optional(
        z
          .string()
          .refine((value) => config.shootLocations.includes(value), 'Choose a current location.'),
      ),
      referralSource: optional(
        z
          .string()
          .refine(
            (value) => config.referralSources.includes(value),
            'Choose a current referral source.',
          ),
      ),
      turnstileToken: z.string().min(1, 'Complete the verification.').max(2048),
    })
    .superRefine((value, ctx) => {
      if (value.contactMethod !== 'email' && !value.phone)
        ctx.addIssue({
          code: 'custom',
          path: ['phone'],
          message: 'Enter a phone number for calls or texts.',
        });
    })
    .transform(
      (value) =>
        Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Omit<
          typeof value,
          never
        >,
    );
};
export type Inquiry = z.output<ReturnType<typeof inquirySchema>>;
