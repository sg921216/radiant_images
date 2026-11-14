import { expect, test } from 'vitest';
import { bannerInputSchema, localScheduleToIso, scheduleLocalValue } from '../src/schemas/banner';
test('banner input trims text, normalizes offsets and permits only HTTPS links and increasing windows', () => {
  const value = {
    message: '  Hello  ',
    startsAt: '2026-11-13T07:00:00-05:00',
    endsAt: '2026-11-13T08:00:00-05:00',
    linkUrl: 'https://example.invalid',
  };
  expect(bannerInputSchema.parse(value)).toMatchObject({
    message: 'Hello',
    startsAt: '2026-11-13T12:00:00.000Z',
  });
  for (const change of [
    { message: ' ' },
    { linkUrl: 'http://example.invalid' },
    { linkUrl: 'https://user:pass@example.invalid' },
    { endsAt: value.startsAt },
    { startsAt: '2026-02-30T12:00:00Z' },
    { startsAt: '2026-11-13T07:00' },
  ])
    expect(bannerInputSchema.safeParse({ ...value, ...change }).success).toBe(false);
});
test('local scheduling uses the configured timezone and rejects DST gaps and ambiguous folds', () => {
  expect(localScheduleToIso('2026-07-01T09:30', 'America/New_York')).toBe(
    '2026-07-01T13:30:00.000Z',
  );
  expect(localScheduleToIso('2026-12-01T09:30', 'America/New_York')).toBe(
    '2026-12-01T14:30:00.000Z',
  );
  expect(localScheduleToIso('2026-07-01T09:30', 'Asia/Kathmandu')).toBe('2026-07-01T03:45:00.000Z');
  expect(() => localScheduleToIso('2026-03-08T02:30', 'America/New_York')).toThrow(
    /does not exist/,
  );
  expect(() => localScheduleToIso('2026-11-01T01:30', 'America/New_York')).toThrow(/ambiguous/);
  expect(() => localScheduleToIso('2026-02-30T12:00', 'America/New_York')).toThrow();
  expect(scheduleLocalValue('2026-07-01T13:30:00.000Z', 'America/New_York')).toBe(
    '2026-07-01T09:30',
  );
});
