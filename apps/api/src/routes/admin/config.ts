import { Hono } from 'hono';
import { siteConfigSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { ApiFault, validate, jsonBody } from '../../middleware/validate';
import { auditedMutation } from '../../services/mutation';
import { senderVerification } from '../../services/email';
export function configRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/', async (c) => {
    const row = await c.env.DB.prepare(
      'SELECT inquiry_recipient AS inquiryRecipient,sender_address AS senderAddress,public_contact_email AS publicContactEmail,shoot_locations AS shootLocations,referral_sources AS referralSources,timezone FROM site_config WHERE id=1',
    ).first<{
      inquiryRecipient: string;
      senderAddress: string;
      publicContactEmail: string;
      shootLocations: string;
      referralSources: string;
      timezone: string;
    }>();
    if (!row) throw new ApiFault(500, 'config_unavailable', 'Settings are unavailable.');
    return c.json(
      siteConfigSchema.parse({
        ...row,
        shootLocations: JSON.parse(row.shootLocations),
        referralSources: JSON.parse(row.referralSources),
      }),
    );
  });
  app.put('/', async (c) => {
    const input = validate(siteConfigSchema, await jsonBody(c.req.raw));
    const sender = await senderVerification(c.env, runtime, input.senderAddress);
    if (sender === 'unavailable')
      throw new ApiFault(
        502,
        'sender_verification_unavailable',
        'Sender verification is unavailable. No settings were changed.',
      );
    if (sender === 'unverified')
      throw new ApiFault(
        400,
        'sender_unverified',
        'Choose the Gmail identity or an accepted send-as alias.',
        { senderAddress: 'This sender is not verified for the connected Gmail account.' },
      );
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'UPDATE site_config SET inquiry_recipient=?,sender_address=?,public_contact_email=?,shoot_locations=?,referral_sources=?,timezone=?,updated_at=? WHERE id=1',
        ).bind(
          input.inquiryRecipient,
          input.senderAddress,
          input.publicContactEmail,
          JSON.stringify(input.shootLocations),
          JSON.stringify(input.referralSources),
          input.timezone,
          runtime.now().toISOString(),
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'config.saved',
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(input);
  });
  return app;
}
