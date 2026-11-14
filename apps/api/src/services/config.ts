import { publicConfigSchema, emailSchema } from '@radiant/shared';
import { ApiFault } from '../middleware/validate';
export async function readConfig(db: D1Database) {
  const row = await db.prepare('SELECT * FROM site_config WHERE id=1').first<{
    inquiry_recipient: string;
    sender_address: string;
    public_contact_email: string;
    shoot_locations: string;
    referral_sources: string;
    timezone: string;
  }>();
  if (!row)
    throw new ApiFault(
      500,
      'configuration_unavailable',
      'The contact form is temporarily unavailable.',
    );
  return {
    ...publicConfigSchema.parse({
      shootLocations: JSON.parse(row.shoot_locations),
      referralSources: JSON.parse(row.referral_sources),
      timezone: row.timezone,
      publicContactEmail: row.public_contact_email,
    }),
    inquiryRecipient: emailSchema.parse(row.inquiry_recipient),
    senderAddress: emailSchema.parse(row.sender_address),
  };
}
