import { Hono } from 'hono';
import type { AppEnv } from '../env';
import type { Runtime } from '../services/runtime';
import { publicContent } from '../services/publicContent';
export function publicRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/bootstrap', async (c) => {
    const body = await publicContent(c.env, runtime.now());
    c.header('Cache-Control', 'public, max-age=0, s-maxage=20, must-revalidate');
    return c.json(body);
  });
  return app;
}
