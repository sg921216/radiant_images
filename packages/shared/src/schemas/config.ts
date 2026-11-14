import { publicConfigSchema } from './content';
import { emailSchema } from './common';
export const siteConfigSchema = publicConfigSchema.extend({
  inquiryRecipient: emailSchema,
  senderAddress: emailSchema,
});
export type SiteConfig = import('zod').infer<typeof siteConfigSchema>;
