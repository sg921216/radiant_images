import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';
import type { Runtime } from '../services/runtime';
import { authenticate } from '../services/session';
import { rateLimit } from './rateLimit';
export function requireOwner(runtime: Runtime, limitMutations = false): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set('owner', await authenticate(c.env, c.req.header('Authorization'), runtime.now()));
    if (limitMutations && !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method))
      return rateLimit(runtime, 'admin', 120, 60, true)(c, next);
    await next();
  };
}
