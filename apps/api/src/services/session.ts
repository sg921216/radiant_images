import { ulid } from 'ulid';
import type { Env } from '../env';
import { ApiFault } from '../middleware/validate';
import { randomToken, sha256 } from './crypto';
const DAY = 24 * 60 * 60 * 1000;
export function isOwner(env: Env, email: string) {
  return env.OWNER_ALLOWLIST.split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
export async function redeemGrant(env: Env, code: string, now: Date) {
  const hash = await sha256(code);
  const instant = now.toISOString();
  const grant = await env.DB.prepare(
    'SELECT owner_email FROM exchange_codes WHERE code_hash=? AND expires_at>?',
  )
    .bind(hash, instant)
    .first<{ owner_email: string }>();
  if (!grant) throw new ApiFault(400, 'invalid_code', 'Sign in with Google again.');
  if (!isOwner(env, grant.owner_email)) {
    await env.DB.prepare('DELETE FROM exchange_codes WHERE code_hash=?').bind(hash).run();
    throw new ApiFault(403, 'forbidden', 'This account does not have owner access.');
  }
  const token = randomToken();
  const tokenHash = await sha256(token);
  const id = ulid();
  const absolute = new Date(now.getTime() + 7 * DAY).toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO sessions(id,token_hash,owner_email,last_seen_at,absolute_expires_at,created_at) SELECT ?,?,owner_email,?,?,? FROM exchange_codes WHERE code_hash=? AND expires_at>? AND owner_email=? RETURNING id',
    ).bind(id, tokenHash, instant, absolute, instant, hash, instant, grant.owner_email),
    env.DB.prepare(
      'DELETE FROM exchange_codes WHERE code_hash=? AND EXISTS(SELECT 1 FROM sessions WHERE id=? AND token_hash=?)',
    ).bind(hash, id, tokenHash),
  ]);
  if (!results[0]?.results.length)
    throw new ApiFault(400, 'invalid_code', 'Sign in with Google again.');
  return {
    token,
    session: { email: grant.owner_email, expiresAt: new Date(now.getTime() + DAY).toISOString() },
  };
}
export async function authenticate(env: Env, authorization: string | undefined, now: Date) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization ?? '');
  if (!match) throw new ApiFault(401, 'unauthorized', 'Please sign in.');
  const hash = await sha256(match[1]!);
  const row = await env.DB.prepare(
    'SELECT id,owner_email,last_seen_at,absolute_expires_at FROM sessions WHERE token_hash=?',
  )
    .bind(hash)
    .first<{
      id: string;
      owner_email: string;
      last_seen_at: string;
      absolute_expires_at: string;
    }>();
  if (!row) throw new ApiFault(401, 'unauthorized', 'Please sign in.');
  if (!isOwner(env, row.owner_email)) {
    await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(row.id).run();
    throw new ApiFault(403, 'forbidden', 'This account does not have owner access.');
  }
  if (
    now.getTime() - Date.parse(row.last_seen_at) >= DAY ||
    now.getTime() >= Date.parse(row.absolute_expires_at)
  ) {
    await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(row.id).run();
    throw new ApiFault(401, 'session_expired', 'Your session has expired. Please sign in again.');
  }
  await env.DB.prepare('UPDATE sessions SET last_seen_at=MAX(last_seen_at,?) WHERE id=?')
    .bind(now.toISOString(), row.id)
    .run();
  return {
    id: row.id,
    email: row.owner_email,
    expiresAt: new Date(
      Math.min(now.getTime() + DAY, Date.parse(row.absolute_expires_at)),
    ).toISOString(),
  };
}
