// Test-only entrypoint. The production Worker never imports this module.
import { createApp } from '../apps/api/src';
import type { Env } from '../apps/api/src/env';
import { resetSynthetic } from './adapter';
import { assertLocalTarget } from '../scripts/local-target';
import { sha256 } from '../apps/api/src/services/crypto';
import { InvalidImage, type VerifiedImages } from '../apps/api/src/services/imageProvider';
import { seedPerformanceData } from './performance-data';
import { galleryUploadSchema, idSchema, imageHeader } from '../packages/shared/src';
type Mode = 'accepted' | 'rejected' | 'lost' | 'captcha_failed' | 'captcha_outage';
let mode: Mode = 'accepted';
let now = new Date('2026-11-13T12:00:00.000Z');
let sent: string[] = [];
let providerDelay = 0;
const app = createApp({
  now: () => new Date(now),
  validateImages: async (input) => {
    const body = new FormData();
    for (const name of ['original', 'full', 'card', 'thumb'] as const)
      body.set(name, new Blob([new Uint8Array(input[name])]), name);
    const response = await fetch('http://127.0.0.1:8790/validate', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 400) throw new InvalidImage();
    if (!response.ok) throw new Error('Local image provider unavailable');
    const data = (await response.json()) as { original: VerifiedImages['original'] } & Record<
      'full' | 'card' | 'thumb',
      { width: number; height: number; base64: string }
    >;
    return {
      original: data.original,
      ...Object.fromEntries(
        (['full', 'card', 'thumb'] as const).map((name) => [
          name,
          {
            width: data[name].width,
            height: data[name].height,
            bytes: Uint8Array.from(atob(data[name].base64), (c) => c.charCodeAt(0)),
          },
        ]),
      ),
    } as VerifiedImages;
  },
  fetch: async (input, init) => {
    if (providerDelay) await new Promise((resolve) => setTimeout(resolve, providerDelay));
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token')
      return Response.json({ access_token: 'synthetic-token' });
    if (url.includes('turnstile/v0/siteverify')) {
      if (mode === 'captcha_outage') throw new Error('synthetic outage');
      return Response.json({
        success: mode !== 'captcha_failed',
        hostname: '127.0.0.1',
        action: 'inquiry',
      });
    }
    if (url.endsWith('/settings/sendAs'))
      return Response.json({
        sendAs: [{ sendAsEmail: 'owner@example.invalid', verificationStatus: 'accepted' }],
      });
    if (url.endsWith('/messages/send')) {
      if (mode === 'rejected') return new Response('', { status: 403 });
      sent.push(String(init?.body));
      if (mode === 'lost') throw new Error('synthetic response loss');
      return Response.json({ id: `synthetic-${sent.length}` });
    }
    throw new Error('Unapproved external provider boundary');
  },
});
export default {
  async fetch(request: Request, env: Env) {
    assertLocalTarget(env.WEB_ORIGIN);
    assertLocalTarget(env.API_ORIGIN);
    const url = new URL(request.url);
    if (url.pathname.startsWith('/__test/')) {
      assertLocalTarget(url.href);
      if (request.headers.get('X-Synthetic-Test') !== 'local-only')
        return new Response('', { status: 403 });
      if (url.pathname === '/__test/reset' && request.method === 'POST') {
        await resetSynthetic(env);
        mode = 'accepted';
        providerDelay = 0;
        sent = [];
        now = new Date('2026-11-13T12:00:00.000Z');
        return Response.json({ ok: true });
      }
      if (url.pathname === '/__test/control' && request.method === 'POST') {
        const value = (await request.json()) as {
          mode?: Mode;
          now?: string;
          checklistFailure?: boolean;
          historyFailure?: boolean;
          providerDelay?: number;
        };
        if (value.mode) mode = value.mode;
        if (value.now) now = new Date(value.now);
        if (value.providerDelay !== undefined)
          providerDelay = value.providerDelay === 200 ? 200 : 0;
        if (value.checklistFailure === true)
          await env.DB.exec(
            "CREATE TRIGGER IF NOT EXISTS synthetic_checklist_failure BEFORE INSERT ON client_checklist_state BEGIN SELECT RAISE(ABORT,'synthetic checklist failure'); END;",
          );
        if (value.checklistFailure === false)
          await env.DB.exec('DROP TRIGGER IF EXISTS synthetic_checklist_failure');
        if (value.historyFailure === true)
          await env.DB.exec(
            "CREATE TRIGGER IF NOT EXISTS synthetic_history_failure BEFORE INSERT ON client_emails BEGIN SELECT RAISE(ABORT,'synthetic history failure'); END;",
          );
        if (value.historyFailure === false)
          await env.DB.exec('DROP TRIGGER IF EXISTS synthetic_history_failure');
        return Response.json({ ok: true });
      }
      if (url.pathname === '/__test/performance' && request.method === 'POST')
        return Response.json(await seedPerformanceData(env, now));
      if (url.pathname === '/__test/fixture-image' && request.method === 'POST') {
        const form = await request.formData();
        const id = idSchema.parse(form.get('id'));
        const metadata = galleryUploadSchema.parse(JSON.parse(String(form.get('metadata'))));
        for (const variant of ['full', 'card', 'thumb'] as const) {
          const part = form.get(variant);
          if (!(part instanceof File) || part.size > 200 * 1024)
            return new Response('', { status: 400 });
          const bytes = new Uint8Array(await part.arrayBuffer()),
            info = imageHeader(bytes);
          if (info.mime !== 'image/webp' || info.hasMetadata || info.animated)
            return new Response('', { status: 400 });
          await env.MEDIA.put(`images/${id}/${variant}.webp`, bytes, {
            httpMetadata: { contentType: 'image/webp' },
          });
          if (variant === 'full')
            await env.MEDIA.put(`originals/${id}/source`, bytes, {
              httpMetadata: { contentType: 'image/webp' },
            });
        }
        await env.DB.prepare(
          'INSERT INTO gallery_images(id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height) VALUES (?,?,?,(SELECT COUNT(*) FROM gallery_images),?,?,?,?,?,?)',
        )
          .bind(
            id,
            metadata.tag,
            metadata.altText,
            metadata.width,
            metadata.height,
            metadata.originalMime,
            metadata.originalBytes,
            metadata.width,
            metadata.height,
          )
          .run();
        return Response.json({ ok: true });
      }
      if (url.pathname === '/__test/grant' && request.method === 'POST') {
        const code = 'synthetic-identity-grant-00000000000000000000';
        await env.DB.prepare(
          'INSERT OR REPLACE INTO exchange_codes (code_hash,owner_email,created_at,expires_at) VALUES (?,?,?,?)',
        )
          .bind(
            await sha256(code),
            'owner@example.invalid',
            now.toISOString(),
            new Date(now.getTime() + 60000).toISOString(),
          )
          .run();
        return Response.json({ code });
      }
      if (url.pathname === '/__test/messages')
        return Response.json({ count: sent.length, messages: sent });
      return new Response('', { status: 404 });
    }
    return app.fetch(request, env);
  },
};
