import { expect, test } from 'vitest';
import { clientInputSchema } from '../src/schemas/client';
import { templateListSchema, sendEmailSchema } from '../src/schemas/template';
import { checklistSchema } from '../src/schemas/checklist';
import { questionsSchema, answersSchema } from '../src/schemas/questionnaire';
import { expandTemplate, hasQuestionnaireUrl, validPlaceholders } from '../src/templates';
const id = '01K00000000000000000000001';
const origin = 'https://radiant.example.invalid';
test('client fields trim, default optional data and reject invalid manually entered records', () => {
  const client = {
    firstName: ' Avery ',
    lastName: ' Example ',
    email: 'avery@example.invalid',
    shootType: 'family',
  };
  expect(clientInputSchema.parse(client)).toMatchObject({
    firstName: 'Avery',
    lastName: 'Example',
    phone: null,
    sessionDate: null,
    notes: '',
  });
  for (const input of [
    { ...client, firstName: ' ' },
    { ...client, email: 'bad' },
    { ...client, phone: 'abc' },
    { ...client, sessionDate: '2026-02-30' },
    { ...client, notes: 'x'.repeat(4001) },
  ])
    expect(clientInputSchema.safeParse(input).success).toBe(false);
});
test('template expansion is single-pass, leaves the questionnaire placeholder for preview and handles missing dates', () => {
  const client = {
    firstName: 'Avery',
    lastName: 'Example',
    shootType: 'family',
    sessionDate: null,
  };
  expect(
    expandTemplate(
      'Hello {{firstName}} {{lastName}}; {{shootType}} on {{sessionDate}}: {{questionnaireLink}}',
      client,
    ),
  ).toBe('Hello Avery Example; Family on Not scheduled: {{questionnaireLink}}');
  expect(expandTemplate('{{firstName}}', { ...client, firstName: '{{questionnaireLink}}' })).toBe(
    '{{questionnaireLink}}',
  );
  expect(validPlaceholders('{{unknown}}')).toBe(false);
  expect(validPlaceholders('{{firstName')).toBe(false);
  expect(hasQuestionnaireUrl(`${origin}/q/${'a'.repeat(43)}`, origin)).toBe(true);
  expect(hasQuestionnaireUrl(`${origin}/%71/${'a'.repeat(43)}`, origin)).toBe(true);
  expect(hasQuestionnaireUrl('https://other.example.invalid/article', origin)).toBe(false);
});
test('templates and sent-message inputs reject live app links, unknown placeholders and header injection', () => {
  const template = {
    id,
    name: 'Welcome',
    subject: 'Hello {{firstName}}',
    body: 'Open {{questionnaireLink}}',
    sortOrder: 0,
  };
  expect(templateListSchema(origin).safeParse([template]).success).toBe(true);
  for (const value of [
    { ...template, body: '{{unknown}}' },
    { ...template, subject: 'Subject\r\nBcc: forged@example.invalid' },
    { ...template, body: `${origin}/q/${'a'.repeat(43)}` },
  ])
    expect(templateListSchema(origin).safeParse([value]).success).toBe(false);
  expect(
    sendEmailSchema(origin).safeParse({ subject: 'Link', body: `${origin}/q/${'b'.repeat(43)}` })
      .success,
  ).toBe(false);
  expect(templateListSchema(origin).safeParse([template, template]).success).toBe(false);
});
test('ordered masters require distinct IDs and choice questions require distinct options', () => {
  expect(checklistSchema.safeParse([{ id, label: 'Plan', sortOrder: 0 }]).success).toBe(true);
  expect(checklistSchema.safeParse([{ id, label: ' ', sortOrder: 0 }]).success).toBe(false);
  expect(
    checklistSchema.safeParse([
      { id, label: 'Plan', sortOrder: 0 },
      { id, label: 'Duplicate', sortOrder: 1 },
    ]).success,
  ).toBe(false);
  const question = {
    id,
    prompt: 'Choose a setting',
    kind: 'single_choice' as const,
    options: ['Studio', 'Garden'],
    required: true,
    sortOrder: 0,
  };
  expect(questionsSchema.safeParse([question]).success).toBe(true);
  for (const options of [null, ['One'], ['Same', ' Same ']])
    expect(questionsSchema.safeParse([{ ...question, options }]).success).toBe(false);
});
test('answers validate against the immutable snapshot, including required fields and strict question IDs', () => {
  const question = {
    id,
    prompt: 'Choose a setting',
    kind: 'single_choice' as const,
    options: ['Studio', 'Garden'],
    required: true,
    sortOrder: 0,
  };
  const schema = answersSchema([question]);
  expect(schema.safeParse({ [id]: 'Studio' }).success).toBe(true);
  for (const answers of [
    {},
    { [id]: 'Unknown' },
    { [id]: ['Studio'] },
    { [id]: 'Studio', unknown: 'extra' },
  ])
    expect(schema.safeParse(answers).success).toBe(false);
});
