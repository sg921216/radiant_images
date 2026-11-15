import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';
import type { Runtime } from '../services/runtime';
import { hmac } from '../services/crypto';
import { ApiFault } from './validate';
export async function consumeRateLimit(
  db: D1Database,
  key: string,
  group: string,
  subject: string,
  limit: number,
  period: number,
  now: number,
) {
  const hash = await hmac(key, `${group}\n${subject}`);
  const start = Math.floor(now / period) * period;
  const row = await db
    .prepare(
      `INSERT INTO rate_limit_windows (group_name,subject_hash,window_start,request_count,expires_at) VALUES (?,?,?,1,?) ON CONFLICT(group_name,subject_hash,window_start) DO UPDATE SET request_count=request_count+1 WHERE request_count<? RETURNING request_count`,
    )
    .bind(group, hash, start, start + period, limit)
    .first();
  return { allowed: row !== null, retryAfter: Math.max(1, Math.ceil(start + period - now)) };
}
export function rateLimit(
  runtime: Runtime,
  group: string,
  limit: number,
  period: number,
  owner = false,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const subject = owner
      ? c.get('owner').id
      : (c.req.header('CF-Connecting-IP') ?? 'missing-trusted-ip');
    const result = await consumeRateLimit(
      c.env.DB,
      c.env.RATE_LIMIT_KEY,
      group,
      subject,
      limit,
      period,
      runtime.now().getTime() / 1000,
    );
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfter));
      throw new ApiFault(
        429,
        'rate_limited',
        'Too many requests. Please wait before trying again.',
      );
    }
    await next();
  };
}
