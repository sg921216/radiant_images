import { Hono } from 'hono';
import { ulid } from 'ulid';
import { bannerInputSchema, idSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { ApiFault, jsonBody, validate } from '../../middleware/validate';
import { auditedMutation } from '../../services/mutation';
import { listBanners } from '../../services/banners';
export function bannerRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/', async (c) => c.json(await listBanners(c.env.DB)));
  app.post('/', async (c) => {
    const input = validate(bannerInputSchema, await jsonBody(c.req.raw));
    const id = ulid(),
      now = runtime.now().toISOString();
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'INSERT INTO banners (id,message,link_url,starts_at,ends_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
        ).bind(id, input.message, input.linkUrl, input.startsAt, input.endsAt, now, now),
      ],
      {
        actor: c.get('owner').email,
        action: 'banner.created',
        entityType: 'banner',
        entityId: id,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json({ id, ...input }, 201);
  });
  app.use('/:id', async (c, next) => {
    const id = validate(idSchema, c.req.param('id'));
    if (!(await c.env.DB.prepare('SELECT id FROM banners WHERE id=?').bind(id).first()))
      throw new ApiFault(404, 'not_found', 'This banner was not found.');
    await next();
  });
  app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const input = validate(bannerInputSchema, await jsonBody(c.req.raw));
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'UPDATE banners SET message=?,link_url=?,starts_at=?,ends_at=?,updated_at=? WHERE id=?',
        ).bind(
          input.message,
          input.linkUrl,
          input.startsAt,
          input.endsAt,
          runtime.now().toISOString(),
          id,
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'banner.edited',
        entityType: 'banner',
        entityId: id,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json({ id, ...input });
  });
  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await auditedMutation(c.env.DB, [c.env.DB.prepare('DELETE FROM banners WHERE id=?').bind(id)], {
      actor: c.get('owner').email,
      action: 'banner.deleted',
      entityType: 'banner',
      entityId: id,
      outcome: 'ok',
      requestId: c.get('requestId'),
    });
    return c.body(null, 204);
  });
  return app;
}
