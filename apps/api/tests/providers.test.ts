import { env } from 'cloudflare:workers';
import { expect, test, vi } from 'vitest';
import { buildMime, sendEmail, verifiedSender } from '../src/services/email';
import { verifyCaptcha } from '../src/services/turnstile';
import type { Runtime } from '../src/services/runtime';
const message = {
  from: 'studio@example.invalid',
  to: 'visitor@example.invalid',
  replyTo: 'reply@example.invalid',
  subject: 'A résumé 📷',
  body: 'Synthetic message\nSecond line',
};
function runtime(
  send: () => Promise<Response>,
  refresh = () =>
    Promise.resolve(Response.json({ access_token: 'synthetic-access', expires_in: 3600 })),
) {
  return {
    now: () => new Date('2026-11-13T12:00:00Z'),
    fetch: vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes('/token') ? refresh() : send(),
    ),
  } satisfies Runtime;
}
test('MIME rejects header injection and safely encodes Unicode subject/body', () => {
  expect(() => buildMime({ ...message, subject: 'Hello\r\nBcc: other@example.invalid' })).toThrow();
  const mime = buildMime(message);
  expect(mime).toContain('Subject: =?UTF-8?B?');
  expect(mime).toContain('Content-Transfer-Encoding: base64');
  expect(mime).toContain('Reply-To: reply@example.invalid');
  expect(mime).not.toContain('résumé');
});
test('one dispatch returns acceptance only with an accepted Gmail response', async () => {
  const r = runtime(async () => Response.json({ id: 'message-id' }));
  expect(await sendEmail(env, r, message)).toEqual({ kind: 'accepted', providerId: 'message-id' });
  expect(r.fetch).toHaveBeenCalledTimes(2);
});
test('refresh failure is definite non-delivery without dispatch', async () => {
  const r = runtime(
    async () => Response.json({ id: 'unused' }),
    async () => new Response('', { status: 400 }),
  );
  expect(await sendEmail(env, r, message)).toEqual({ kind: 'not_sent' });
  expect(r.fetch).toHaveBeenCalledTimes(1);
});
test('dispatch response loss and server errors are uncertain; no automatic retry', async () => {
  for (const send of [
    async () => {
      throw new Error('lost after acceptance');
    },
    async () => new Response('', { status: 503 }),
    async () => Response.json({}),
  ]) {
    const r = runtime(send);
    expect(await sendEmail(env, r, message)).toEqual({ kind: 'unknown' });
    expect(r.fetch).toHaveBeenCalledTimes(2);
  }
});
test('explicit Gmail rejection is definite non-delivery', async () => {
  const r = runtime(async () => new Response('', { status: 403 }));
  expect(await sendEmail(env, r, message)).toEqual({ kind: 'not_sent' });
  expect(r.fetch).toHaveBeenCalledTimes(2);
});
test('each provider call is aborted within two seconds after dispatch', async () => {
  let aborted = false;
  const r: Runtime = {
    now: () => new Date(),
    fetch: vi.fn(async (input, init) => {
      if (String(input).includes('/token')) return Response.json({ access_token: 'test' });
      return new Promise<Response>((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () => {
          aborted = true;
          reject(new DOMException('Aborted', 'AbortError'));
        }),
      );
    }),
  };
  const start = Date.now();
  expect(await sendEmail(env, r, message)).toEqual({ kind: 'unknown' });
  expect(aborted).toBe(true);
  expect(Date.now() - start).toBeLessThan(2600);
});
test('send-as lookup accepts only a matching verified address', async () => {
  const r = runtime(async () =>
    Response.json({
      sendAs: [
        { sendAsEmail: message.from, verificationStatus: 'accepted' },
        { sendAsEmail: 'unverified@example.invalid', verificationStatus: 'pending' },
      ],
    }),
  );
  expect(await verifiedSender(env, r, message.from)).toBe(true);
  expect(await verifiedSender(env, r, 'unverified@example.invalid')).toBe(false);
});
test('CAPTCHA validates action and hostname, and fails closed on expiry/outage', async () => {
  const r = runtime(async () =>
    Response.json({ success: true, hostname: new URL(env.WEB_ORIGIN).hostname, action: 'inquiry' }),
  );
  await expect(verifyCaptcha(env, r, 'synthetic')).resolves.toBeUndefined();
  for (const body of [
    { success: false, 'error-codes': ['timeout-or-duplicate'] },
    { success: true, hostname: 'forged.invalid', action: 'inquiry' },
    { success: true, hostname: new URL(env.WEB_ORIGIN).hostname, action: 'other' },
  ]) {
    await expect(
      verifyCaptcha(
        env,
        runtime(async () => Response.json(body)),
        'synthetic',
      ),
    ).rejects.toMatchObject({ status: 400 });
  }
  await expect(
    verifyCaptcha(
      env,
      runtime(async () => {
        throw new Error('unavailable');
      }),
      'synthetic',
    ),
  ).rejects.toMatchObject({ status: 502 });
});
