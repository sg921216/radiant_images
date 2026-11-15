import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { calculatePKCECodeChallenge } from 'oauth4webapi';
import { createRemoteJWKSet, customFetch, jwtVerify } from 'jose';
import { z } from 'zod';
import type { AppEnv } from '../env';
import type { Runtime } from '../services/runtime';
import { hmac, randomToken, sha256 } from '../services/crypto';
import { isOwner, redeemGrant } from '../services/session';
import { requireOwner } from '../middleware/requireOwner';
import { ApiFault, jsonBody, validate } from '../middleware/validate';
function cookieOptions(origin: string) {
  const url = new URL(origin);
  const secure = url.protocol === 'https:';
  if (!secure && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Insecure auth origin');
  return { name: secure ? '__Host-radiant-oauth' : 'radiant_oauth_local', secure };
}
export function authRoutes(runtime: Runtime) {
  const router = new Hono<AppEnv>();
  const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), {
    timeoutDuration: 2000,
    [customFetch]: async (input, init) => {
      try {
        const response = await runtime.fetch(input, init);
        if (!response.ok) throw new Error('Unavailable keys');
        return response;
      } catch {
        throw new ApiFault(
          502,
          'identity_unavailable',
          'Google sign-in is unavailable. Please start again later.',
        );
      }
    },
  });
  router.get('/google/start', async (c) => {
    const state = randomToken(),
      browser = randomToken();
    const now = runtime.now();
    const nonce = await hmac(c.env.AUTH_KEY, `nonce:${state}`);
    const verifier = await hmac(c.env.AUTH_KEY, `pkce:${state}`);
    await c.env.DB.prepare(
      'INSERT INTO oauth_states(state_hash,browser_hash,nonce_hash,created_at,expires_at) VALUES(?,?,?,?,?)',
    )
      .bind(
        await sha256(state),
        await sha256(browser),
        await sha256(nonce),
        now.toISOString(),
        new Date(now.getTime() + 600000).toISOString(),
      )
      .run();
    const options = cookieOptions(c.env.API_ORIGIN);
    setCookie(c, options.name, browser, {
      path: '/',
      httpOnly: true,
      secure: options.secure,
      sameSite: 'Lax',
      maxAge: 600,
    });
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: c.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${c.env.API_ORIGIN}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email',
      state,
      nonce,
      code_challenge: await calculatePKCECodeChallenge(verifier),
      code_challenge_method: 'S256',
    }).toString();
    return c.redirect(url.toString(), 302);
  });
  router.get('/google/callback', async (c) => {
    const state = c.req.query('state'),
      code = c.req.query('code');
    const options = cookieOptions(c.env.API_ORIGIN);
    const browser = getCookie(c, options.name);
    deleteCookie(c, options.name, { path: '/', secure: options.secure });
    if (!state || !code || !browser || !/^[A-Za-z0-9_-]{43}$/.test(state))
      throw new ApiFault(400, 'invalid_state', 'Sign in with Google again.');
    const record = await c.env.DB.prepare(
      'DELETE FROM oauth_states WHERE state_hash=? AND browser_hash=? AND expires_at>? RETURNING nonce_hash',
    )
      .bind(await sha256(state), await sha256(browser), runtime.now().toISOString())
      .first<{ nonce_hash: string }>();
    if (!record) throw new ApiFault(400, 'invalid_state', 'Sign in with Google again.');
    let response: Response;
    try {
      response = await runtime.fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: c.env.GOOGLE_CLIENT_ID,
          client_secret: c.env.GOOGLE_CLIENT_SECRET,
          code,
          code_verifier: await hmac(c.env.AUTH_KEY, `pkce:${state}`),
          grant_type: 'authorization_code',
          redirect_uri: `${c.env.API_ORIGIN}/auth/google/callback`,
        }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      throw new ApiFault(
        502,
        'identity_unavailable',
        'Google sign-in is unavailable. Please start again later.',
      );
    }
    if (!response.ok)
      throw new ApiFault(
        502,
        'identity_unavailable',
        'Google sign-in is unavailable. Please start again later.',
      );
    let email: string;
    try {
      const body = await response.json<{ id_token?: string }>();
      if (!body.id_token) throw new Error('Missing identity');
      const { payload } = await jwtVerify(body.id_token, jwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: c.env.GOOGLE_CLIENT_ID,
        algorithms: ['RS256'],
        currentDate: runtime.now(),
        requiredClaims: ['iss', 'aud', 'sub', 'iat', 'exp', 'nonce', 'email', 'email_verified'],
      });
      if (
        payload.email_verified !== true ||
        typeof payload.email !== 'string' ||
        !z.email().safeParse(payload.email).success ||
        typeof payload.nonce !== 'string' ||
        (await sha256(payload.nonce)) !== record.nonce_hash ||
        !payload.sub ||
        payload.iat! > Math.floor(runtime.now().getTime() / 1000) + 30 ||
        (payload.azp !== undefined && payload.azp !== c.env.GOOGLE_CLIENT_ID) ||
        (Array.isArray(payload.aud) &&
          payload.aud.length > 1 &&
          payload.azp !== c.env.GOOGLE_CLIENT_ID)
      )
        throw new Error('Invalid identity');
      email = payload.email.toLowerCase();
    } catch (error) {
      if (error instanceof ApiFault) throw error;
      throw new ApiFault(
        400,
        'invalid_identity',
        'Google could not verify this sign-in. Please start again.',
      );
    }
    if (!isOwner(c.env, email)) return c.redirect(`${c.env.WEB_ORIGIN}/admin/denied`, 302);
    const grant = randomToken();
    const now = runtime.now();
    await c.env.DB.prepare(
      'INSERT INTO exchange_codes(code_hash,owner_email,created_at,expires_at) VALUES(?,?,?,?)',
    )
      .bind(
        await sha256(grant),
        email,
        now.toISOString(),
        new Date(now.getTime() + 60000).toISOString(),
      )
      .run();
    return c.redirect(`${c.env.WEB_ORIGIN}/admin/callback#code=${encodeURIComponent(grant)}`, 302);
  });
  router.post('/exchange', async (c) => {
    const input = validate(
      z.strictObject({ code: z.string().regex(/^[A-Za-z0-9_-]{32,256}$/) }),
      await jsonBody(c.req.raw),
    );
    return c.json(await redeemGrant(c.env, input.code, runtime.now()));
  });
  router.get('/session', requireOwner(runtime), (c) => {
    const owner = c.get('owner');
    return c.json({ email: owner.email, expiresAt: owner.expiresAt });
  });
  router.post('/logout', requireOwner(runtime), async (c) => {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(c.get('owner').id).run();
    return c.body(null, 204);
  });
  return router;
}
