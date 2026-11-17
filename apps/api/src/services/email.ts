import type { Env } from '../env';
import type { Runtime } from './runtime';
import { emailSchema } from '@radiant/shared';
import { providerJson } from './provider';
export type EmailOutcome =
  { kind: 'accepted'; providerId: string } | { kind: 'not_sent' } | { kind: 'unknown' };
export interface EmailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  body: string;
}
function base64(text: string) {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function buildMime(message: EmailMessage): string {
  for (const address of [message.from, message.to, message.replyTo]) emailSchema.parse(address);
  if (!message.subject || message.subject.length > 200 || /[\r\n\0]/.test(message.subject))
    throw new Error('invalid_subject');
  const subject = Array.from(message.subject)
    .reduce<string[]>((parts, char) => {
      const last = parts.at(-1) ?? '';
      if (new TextEncoder().encode(last + char).length > 42) parts.push(char);
      else if (parts.length) parts[parts.length - 1] = last + char;
      else parts.push(char);
      return parts;
    }, [])
    .map((part) => `=?UTF-8?B?${base64(part)}?=`)
    .join('\r\n ');
  return [
    `From: ${message.from}`,
    `To: ${message.to}`,
    `Reply-To: ${message.replyTo}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64(message.body.replace(/\r?\n/g, '\r\n'))
      .match(/.{1,76}/g)
      ?.join('\r\n') ?? '',
  ].join('\r\n');
}
async function accessToken(env: Env, runtime: Runtime, deadline: number) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GMAIL_REFRESH_TOKEN)
    throw new Error('email_not_configured');
  const result = await providerJson(
    runtime,
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: env.GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    },
    deadline,
  );
  if (result.status !== 200 || typeof result.data.access_token !== 'string')
    throw new Error('refresh_failed');
  return result.data.access_token;
}
export async function sendEmail(
  env: Env,
  runtime: Runtime,
  message: EmailMessage,
): Promise<EmailOutcome> {
  const deadline = performance.now() + 4000;
  let token: string;
  let raw: string;
  try {
    raw = base64(buildMime(message)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    token = await accessToken(env, runtime, deadline);
  } catch {
    return { kind: 'not_sent' };
  }
  if (performance.now() >= deadline) return { kind: 'not_sent' };
  try {
    const result = await providerJson(
      runtime,
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      },
      deadline,
    );
    if (result.status >= 200 && result.status < 300 && typeof result.data.id === 'string')
      return { kind: 'accepted', providerId: result.data.id };
    if ([400, 401, 403, 404, 413, 422, 429].includes(result.status)) return { kind: 'not_sent' };
    return { kind: 'unknown' };
  } catch {
    return { kind: 'unknown' };
  }
}
export async function verifiedSender(env: Env, runtime: Runtime, email: string): Promise<boolean> {
  return (await senderVerification(env, runtime, email)) === 'verified';
}
export async function senderVerification(
  env: Env,
  runtime: Runtime,
  email: string,
): Promise<'verified' | 'unverified' | 'unavailable'> {
  if (!emailSchema.safeParse(email).success) return 'unverified';
  try {
    const deadline = performance.now() + 4000;
    const token = await accessToken(env, runtime, deadline);
    const result = await providerJson(
      runtime,
      'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs',
      { headers: { Authorization: `Bearer ${token}` } },
      deadline,
    );
    if (result.status !== 200 || !Array.isArray(result.data.sendAs)) return 'unavailable';
    return result.data.sendAs.some(
      (alias: { sendAsEmail?: string; isPrimary?: boolean; verificationStatus?: string }) =>
        alias.sendAsEmail?.toLowerCase() === email.toLowerCase() &&
        // Gmail's verificationStatus applies only to custom aliases, not the primary login.
        (alias.isPrimary === true || alias.verificationStatus === 'accepted'),
    )
      ? 'verified'
      : 'unverified';
  } catch {
    return 'unavailable';
  }
}
