import { Hono } from 'hono';
import type { AppEnv } from '../env';
import type { Runtime } from '../services/runtime';
import { jsonBody } from '../middleware/validate';
import { submitInquiry } from '../services/inquiry';
export function inquiryRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.post('/', async (c) => {
    await submitInquiry(c.env, runtime, await jsonBody(c.req.raw), c.get('requestId'));
    return c.json({ status: 'sent' as const }, 202);
  });
  return app;
}
