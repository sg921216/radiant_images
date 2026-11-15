import { Hono } from 'hono';
import { templateListSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { validate, jsonBody } from '../../middleware/validate';
import { auditedMutation } from '../../services/mutation';
export function templateRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  const list = async (db: D1Database) =>
    (
      await db
        .prepare(
          'SELECT id,name,subject,body,sort_order AS sortOrder FROM email_templates ORDER BY sort_order,id',
        )
        .all()
    ).results;
  app.get('/', async (c) => c.json(await list(c.env.DB)));
  app.put('/', async (c) => {
    const items = validate(templateListSchema(c.env.WEB_ORIGIN), await jsonBody(c.req.raw));
    const ids = items.map((item) => item.id),
      now = runtime.now().toISOString();
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          ids.length
            ? `DELETE FROM email_templates WHERE id NOT IN (${ids.map(() => '?').join(',')})`
            : 'DELETE FROM email_templates',
        ).bind(...ids),
        c.env.DB.prepare("UPDATE email_templates SET name='__temporary_'||id"),
        ...items.map((item) =>
          c.env.DB.prepare(
            'INSERT INTO email_templates (id,name,subject,body,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,subject=excluded.subject,body=excluded.body,sort_order=excluded.sort_order,updated_at=excluded.updated_at',
          ).bind(item.id, item.name, item.subject, item.body, item.sortOrder, now, now),
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'templates.saved',
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(await list(c.env.DB));
  });
  return app;
}
