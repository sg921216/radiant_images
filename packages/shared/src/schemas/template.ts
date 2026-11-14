import { z } from '../validation';
import { idSchema } from './common';
import { hasQuestionnaireUrl, validPlaceholders } from '../templates';
const messageText = (origin: string, max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(validPlaceholders, 'Use only the listed placeholders.')
    .refine(
      (value) => !hasQuestionnaireUrl(value, origin),
      'Use {{questionnaireLink}} instead of pasting a questionnaire URL.',
    );
export const sendEmailSchema = (origin: string) =>
  z.strictObject({
    templateId: idSchema.optional(),
    subject: messageText(origin, 200).refine(
      (value) => !/[\r\n\0]/.test(value),
      'Subject must fit on one line.',
    ),
    body: messageText(origin, 10000),
  });
export const templateListSchema = (origin: string) =>
  z
    .array(
      sendEmailSchema(origin)
        .omit({ templateId: true })
        .extend({
          id: idSchema,
          name: z.string().trim().min(1).max(80),
          sortOrder: z.number().int().min(0),
        }),
    )
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      'Remove duplicate template IDs.',
    )
    .refine(
      (items) => new Set(items.map((item) => item.name)).size === items.length,
      'Use unique template names.',
    )
    .refine(
      (items) => new Set(items.map((item) => item.sortOrder)).size === items.length,
      'Use distinct display positions.',
    );
export type EmailTemplate = z.infer<ReturnType<typeof templateListSchema>>[number];
export type SendEmailInput = z.infer<ReturnType<typeof sendEmailSchema>>;
