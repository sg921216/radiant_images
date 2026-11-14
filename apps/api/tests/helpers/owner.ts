import type { Env } from '../../src/env';
import { sha256 } from '../../src/services/crypto';
export async function ownerHeaders(env: Env, now = new Date('2026-11-13T12:00:00.000Z')) {
  const token = 'o'.repeat(43);
  await env.DB.prepare(
    'INSERT OR REPLACE INTO sessions (id,token_hash,owner_email,last_seen_at,absolute_expires_at,created_at) VALUES (?,?,?,?,?,?)',
  )
    .bind(
      '01K00000000000000000000099',
      await sha256(token),
      'owner@example.invalid',
      now.toISOString(),
      new Date(now.getTime() + 7 * 86400000).toISOString(),
      now.toISOString(),
    )
    .run();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
