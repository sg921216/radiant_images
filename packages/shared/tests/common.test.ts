import { expect, test } from 'vitest';
import {
  emailSchema,
  errorSchema,
  idSchema,
  moneySchema,
  shootTypeSchema,
} from '../src/schemas/common';
import { galleryImageSchema, publicConfigSchema } from '../src/schemas/content';
test.each(['short', '01K0000000000000000000000I', '../client'])('IDs reject %s', (value) =>
  expect(idSchema.safeParse(value).success).toBe(false),
);
test('enums, emails and cents enforce boundaries', () => {
  expect(shootTypeSchema.safeParse('wedding').success).toBe(false);
  expect(emailSchema.safeParse('a@example.invalid\r\nBcc:b@example.invalid').success).toBe(false);
  expect(moneySchema.safeParse(-1).success).toBe(false);
  expect(moneySchema.safeParse(0.5).success).toBe(false);
  expect(moneySchema.safeParse(0).success).toBe(true);
});
test('typed delivery errors cannot reverse their retry semantics', () => {
  for (const [code, retryable] of [
    ['email_not_sent', true],
    ['email_outcome_unknown', false],
    ['email_history_failed', false],
  ] as const) {
    expect(
      errorSchema.safeParse({ error: { code, message: 'Synthetic', retryable } }).success,
    ).toBe(true);
    expect(
      errorSchema.safeParse({ error: { code, message: 'Synthetic', retryable: !retryable } })
        .success,
    ).toBe(false);
    expect(errorSchema.safeParse({ error: { code, message: 'Synthetic' } }).success).toBe(false);
  }
});
test('bootstrap config includes a public contact address and rejects private settings', () => {
  const config = {
    shootLocations: ['Studio'],
    referralSources: ['Business Card'],
    timezone: 'America/New_York',
    publicContactEmail: 'hello@example.invalid',
  };
  expect(publicConfigSchema.safeParse(config).success).toBe(true);
  expect(publicConfigSchema.safeParse({ ...config, publicContactEmail: '' }).success).toBe(false);
  expect(
    publicConfigSchema.safeParse({ ...config, inquiryRecipient: 'private@example.invalid' })
      .success,
  ).toBe(false);
  expect(publicConfigSchema.safeParse({ ...config, timezone: 'Not/A_Timezone' }).success).toBe(
    false,
  );
});
test('portfolio images require descriptive alternatives and bounded dimensions', () => {
  const image = {
    id: '01K00000000000000000000001',
    tag: 'family',
    altText: 'Synthetic blue pattern',
    sortOrder: 0,
    width: 1000,
    height: 800,
    urls: {
      full: 'https://api.example.invalid/images/a/full',
      card: 'https://api.example.invalid/images/a/card',
      thumb: 'https://api.example.invalid/images/a/thumb',
    },
  };
  expect(galleryImageSchema.safeParse(image).success).toBe(true);
  expect(galleryImageSchema.safeParse({ ...image, altText: '   ' }).success).toBe(false);
  expect(galleryImageSchema.safeParse({ ...image, width: 2001 }).success).toBe(false);
});
