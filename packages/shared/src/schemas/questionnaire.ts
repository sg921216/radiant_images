import { z } from '../validation';
import { idSchema, isoTimeSchema } from './common';
export const questionSchema = z
  .strictObject({
    id: idSchema,
    prompt: z.string().trim().min(1).max(300),
    kind: z.enum(['short_text', 'long_text', 'single_choice']),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(10).nullable(),
    required: z.boolean(),
    sortOrder: z.number().int().min(0),
  })
  .refine(
    (question) =>
      question.kind === 'single_choice'
        ? question.options !== null && new Set(question.options).size === question.options.length
        : question.options === null,
    {
      path: ['options'],
      message: 'Choice questions need 2–10 distinct options; text questions have no options.',
    },
  );
export const questionsSchema = z
  .array(questionSchema)
  .max(40)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    'Remove duplicate question IDs.',
  )
  .refine(
    (items) => new Set(items.map((item) => item.sortOrder)).size === items.length,
    'Use distinct display positions.',
  );
export type Question = z.infer<typeof questionSchema>;
export function answersSchema(questions: Question[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const question of questions) {
    let field = z
      .string({
        error: (issue) =>
          question.required && issue.input === undefined
            ? 'Please answer this question.'
            : undefined,
      })
      .trim()
      .max(question.kind === 'short_text' ? 300 : 4000);
    if (question.required) field = field.min(1, 'Please answer this question.');
    const answer =
      question.kind === 'single_choice'
        ? field.refine(
            (value) => (!question.required && !value) || question.options!.includes(value),
            'Choose one of the listed answers.',
          )
        : field;
    shape[question.id] = question.required ? answer : answer.optional();
  }
  return z.strictObject(shape);
}
export const questionnaireInviteSchema = z.strictObject({
  id: idSchema,
  sentAt: isoTimeSchema,
  expiresAt: isoTimeSchema,
  submittedAt: isoTimeSchema.nullable(),
  status: z.enum(['pending', 'submitted', 'expired']),
  questionsSnapshot: questionsSchema,
  answers: z.record(z.string(), z.string()).nullable(),
});
export type QuestionnaireInvite = z.infer<typeof questionnaireInviteSchema>;
