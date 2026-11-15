import { Hono } from 'hono';
import type { AppEnv } from '../env';
import type { Runtime } from '../services/runtime';
import { jsonBody } from '../middleware/validate';
import { publicQuestionnaire, submitQuestionnaire } from '../services/questionnaire';
export function questionnaireRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Robots-Tag', 'noindex, nofollow');
    c.header('Referrer-Policy', 'no-referrer');
    await next();
  });
  app.get('/:token', async (c) =>
    c.json(await publicQuestionnaire(c.env.DB, c.req.param('token'), runtime.now())),
  );
  app.post('/:token', async (c) => {
    await submitQuestionnaire(
      c.env.DB,
      c.req.param('token'),
      runtime.now(),
      await jsonBody(c.req.raw),
    );
    return c.json({ status: 'submitted' }, 201);
  });
  return app;
}
