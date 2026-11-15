import { z } from '../validation';
import { isoTimeSchema, timezoneSchema } from './common';
const timestamp = isoTimeSchema.transform((value) => new Date(value).toISOString());
export const bannerInputSchema = z
  .strictObject({
    message: z.string().trim().min(1).max(200),
    linkUrl: z
      .url()
      .refine((value) => {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password;
      }, 'Use an HTTPS link without credentials.')
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    startsAt: timestamp,
    endsAt: timestamp,
  })
  .refine((value) => value.endsAt > value.startsAt, {
    path: ['endsAt'],
    message: 'The end must be after the start.',
  });
export type BannerInput = z.infer<typeof bannerInputSchema>;
export function scheduleLocalValue(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
export function localScheduleToIso(value: string, timezone: string): string {
  timezoneSchema.parse(timezone);
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value) ||
    !isoTimeSchema.safeParse(`${value}:00Z`).success
  )
    throw new Error('Choose a valid date and time.');
  const nominal = Date.parse(`${value}:00Z`);
  const offsets = new Set<number>();
  // Probe both sides of any transition, then round-trip every candidate. Never guess a DST fold.
  for (let hours = -36; hours <= 36; hours += 6) {
    const probe = nominal + hours * 3600000;
    offsets.add(
      Date.parse(`${scheduleLocalValue(new Date(probe).toISOString(), timezone)}:00Z`) - probe,
    );
  }
  const matches = [...offsets]
    .map((offset) => new Date(nominal - offset).toISOString())
    .filter((iso) => scheduleLocalValue(iso, timezone) === value);
  if (!matches.length)
    throw new Error(
      'This local time does not exist because the clocks change. Choose another time.',
    );
  if (matches.length > 1)
    throw new Error(
      'This local time is ambiguous because the clocks change. Choose a time outside the repeated hour.',
    );
  return matches[0]!;
}
