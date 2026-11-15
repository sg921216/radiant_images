import type { Env } from '../env';
import type { Runtime } from './runtime';
import { providerJson } from './provider';
import { ApiFault } from '../middleware/validate';
export async function verifyCaptcha(env: Env, runtime: Runtime, token: string): Promise<void> {
  if (!token || token.length > 2048)
    throw new ApiFault(400, 'captcha_invalid', 'Complete the verification again.', {
      turnstileToken: 'Complete the verification again.',
    });
  let result: Awaited<ReturnType<typeof providerJson>>;
  try {
    result = await providerJson(
      runtime,
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
      },
    );
  } catch {
    throw new ApiFault(
      502,
      'email_not_sent',
      'Verification is unavailable. Your message has not been sent.',
      undefined,
      true,
    );
  }
  if (result.status !== 200)
    throw new ApiFault(
      502,
      'email_not_sent',
      'Verification is unavailable. Your message has not been sent.',
      undefined,
      true,
    );
  if (
    result.data.success !== true ||
    result.data.hostname !== new URL(env.WEB_ORIGIN).hostname ||
    result.data.action !== 'inquiry'
  )
    throw new ApiFault(400, 'captcha_invalid', 'Complete the verification again.', {
      turnstileToken: 'Complete the verification again.',
    });
}
