import { inquirySchema } from '@radiant/shared';
import type { Env } from '../env';
import type { Runtime } from './runtime';
import { verifyCaptcha } from './turnstile';
import { readConfig } from './config';
import { validate, ApiFault } from '../middleware/validate';
import { hmac } from './crypto';
import { sendEmail } from './email';
import { audit, fallbackAudit } from './audit';
export async function submitInquiry(env: Env, runtime: Runtime, input: unknown, requestId: string) {
  const token =
    typeof input === 'object' &&
    input !== null &&
    'turnstileToken' in input &&
    typeof input.turnstileToken === 'string'
      ? input.turnstileToken
      : '';
  await verifyCaptcha(env, runtime, token);
  const config = await readConfig(env.DB);
  const now = runtime.now();
  const value = validate(inquirySchema(config, now), input);
  const hash = await hmac(
    env.RATE_LIMIT_KEY,
    JSON.stringify([
      value.email.toLowerCase(),
      (value.message ?? '').replace(/\s+/g, ' ').trim().toLowerCase(),
    ]),
  );
  const expiresAt = new Date(now.getTime() + 120000).toISOString();
  const claim = await env.DB.prepare(
    'INSERT INTO inquiry_dedupe (hash,expires_at) VALUES (?,?) ON CONFLICT(hash) DO UPDATE SET expires_at=excluded.expires_at WHERE inquiry_dedupe.expires_at<=? RETURNING hash',
  )
    .bind(hash, expiresAt, now.toISOString())
    .first();
  if (!claim)
    throw new ApiFault(
      409,
      'duplicate',
      'A matching inquiry was recently submitted. Check receipt with Rebekah before sending again.',
    );
  const labels: Record<string, string> = {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    contactMethod: 'Preferred contact',
    postalCode: 'Postal code',
    shootType: 'Shoot type',
    preferredDay: 'Preferred day',
    specialRequests: 'Special requests',
    sessionLengthHours: 'Session length (hours)',
    numberOfPeople: 'Number of people',
    shootLocation: 'Shoot location',
    referralSource: 'Referral source',
    message: 'Message',
  };
  const body = Object.entries(labels)
    .map(([key, label]) => `${label}: ${value[key as keyof typeof value] ?? 'Not provided'}`)
    .join('\n');
  const outcome = await sendEmail(env, runtime, {
    from: config.senderAddress,
    to: config.inquiryRecipient,
    replyTo: value.email,
    subject: `New ${value.shootType} photography inquiry`,
    body,
  });
  if (outcome.kind === 'not_sent')
    await env.DB.prepare('DELETE FROM inquiry_dedupe WHERE hash=? AND expires_at=?')
      .bind(hash, expiresAt)
      .run();
  const event = {
    actor: 'visitor',
    action: 'inquiry.send',
    outcome: outcome.kind === 'accepted' ? ('ok' as const) : ('error' as const),
    requestId,
    detail: { code: outcome.kind },
  };
  try {
    await audit(env.DB, event);
  } catch {
    fallbackAudit(event, 'audit_write_failed');
  }
  if (outcome.kind === 'not_sent')
    throw new ApiFault(
      502,
      'email_not_sent',
      'Your inquiry was not sent. You can submit it again.',
      undefined,
      true,
    );
  if (outcome.kind === 'unknown')
    throw new ApiFault(
      504,
      'email_outcome_unknown',
      'Your inquiry may have been sent. Contact Rebekah to check receipt before sending again.',
      undefined,
      false,
    );
}
