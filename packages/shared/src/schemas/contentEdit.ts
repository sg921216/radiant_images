import { z } from '../validation';
import { pageSchema, faqSchema } from './content';
const safe = (value: string) => !/<\/?[a-z!][^>]*>|(?:javascript|data|vbscript)\s*:/i.test(value);
export const pageEditSchema = pageSchema.superRefine((page, ctx) => {
  if (!safe(page.introMd) || page.howItWorks.some((step) => !safe(step.title) || !safe(step.body)))
    ctx.addIssue({
      code: 'custom',
      path: ['introMd'],
      message: 'Use plain text or safe Markdown. HTML and executable links are not allowed.',
    });
});
export const faqEditSchema = z
  .array(faqSchema)
  .min(4)
  .max(40)
  .superRefine((entries, ctx) => {
    if (new Set(entries.map((e) => e.id)).size !== entries.length)
      ctx.addIssue({ code: 'custom', message: 'Each question needs a unique identifier.' });
    for (const entry of entries)
      if (!safe(entry.question) || !safe(entry.answer))
        ctx.addIssue({
          code: 'custom',
          message: 'Use plain text or safe Markdown without HTML or executable links.',
        });
    const text = entries
      .map((e) => e.question + ' ' + e.answer)
      .join(' ')
      .toLowerCase();
    for (const topic of ['expect', 'wear', 'payment', 'deposit'])
      if (!text.includes(topic))
        ctx.addIssue({ code: 'custom', message: `Keep an answer covering ${topic}.` });
  });
