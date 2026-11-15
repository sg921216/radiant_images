import { expect, test } from 'vitest';
import { inquirySchema } from '../src/schemas/inquiry';
const config = {
  timezone: 'America/New_York',
  shootLocations: ['Studio'],
  referralSources: ['Business Card'],
  publicContactEmail: 'hello@example.invalid',
};
const valid = {
  firstName: 'Avery',
  lastName: 'Example',
  email: 'avery@example.invalid',
  contactMethod: 'email',
  shootType: 'family',
  turnstileToken: 'synthetic',
};
const schema = inquirySchema(config, new Date('2026-11-14T02:00:00Z'));
test('call/text require a phone; blank optional values normalize away', () => {
  for (const contactMethod of ['call', 'text'])
    expect(schema.safeParse({ ...valid, contactMethod, phone: '' }).success).toBe(false);
  const parsed = schema.parse({
    ...valid,
    phone: '',
    postalCode: '',
    preferredDay: '',
    sessionLengthHours: '',
    numberOfPeople: '',
  });
  expect(parsed).not.toHaveProperty('phone');
});
test('bounds use calendar months and configured timezone, including invalid dates', () => {
  for (const preferredDay of ['2026-11-12', '2028-05-14', '2027-02-30'])
    expect(schema.safeParse({ ...valid, preferredDay }).success).toBe(false);
  for (const preferredDay of ['2026-11-13', '2028-05-13'])
    expect(schema.safeParse({ ...valid, preferredDay }).success).toBe(true);
});
test('stale options, forged delivery fields, header injection and numeric bounds fail', () => {
  for (const value of [
    { shootLocation: 'Old studio' },
    { referralSource: 'Old source' },
    { senderAddress: 'forged@example.invalid' },
    { email: 'x@example.invalid\r\nBcc:x@y.invalid' },
    { sessionLengthHours: 0 },
    { sessionLengthHours: 5 },
    { numberOfPeople: 13 },
    { numberOfPeople: 1.5 },
    { message: 'x'.repeat(2001) },
  ])
    expect(schema.safeParse({ ...valid, ...value }).success).toBe(false);
});
