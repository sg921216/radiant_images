import { Hono } from 'hono';
import { pageEditSchema, faqEditSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { validate, jsonBody, ApiFault } from '../../middleware/validate';
import { auditedMutation } from '../../services/mutation';
import { audit, fallbackAudit } from '../../services/audit';
export function contentRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  for (const path of ['/pages/:page', '/faq'])
    app.use(path, async (c, next) => {
      await next();
      if (c.res.status === 400) {
        const event = {
          actor: c.get('owner').email,
          action: 'content.validation',
          outcome: 'error' as const,
          requestId: c.get('requestId'),
        };
        try {
          await audit(c.env.DB, event);
        } catch {
          fallbackAudit(event, 'audit_write_failed');
        }
      }
    });
  app.put('/pages/:page', async (c) => {
    const page = validate(pageEditSchema, await jsonBody(c.req.raw));
    if (page.page !== c.req.param('page'))
      throw new ApiFault(400, 'validation_failed', 'The page does not match the selected section.');
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'UPDATE page_content SET intro_md=?,how_it_works=?,updated_at=? WHERE page=?',
        ).bind(
          page.introMd,
          JSON.stringify(page.howItWorks),
          runtime.now().toISOString(),
          page.page,
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'content.page_saved',
        entityType: 'page',
        entityId: page.page,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(page);
  });
  app.put('/faq', async (c) => {
    const entries = validate(faqEditSchema, await jsonBody(c.req.raw));
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare('DELETE FROM faq_entries'),
        ...entries.map((entry, index) =>
          c.env.DB.prepare(
            'INSERT INTO faq_entries (id,question,answer,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?)',
          ).bind(
            entry.id,
            entry.question,
            entry.answer,
            index,
            runtime.now().toISOString(),
            runtime.now().toISOString(),
          ),
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'content.faq_saved',
        entityType: 'faq',
        outcome: 'ok',
        requestId: c.get('requestId'),
        detail: { count: entries.length },
      },
    );
    return c.json(entries.map((entry, index) => ({ ...entry, sortOrder: index })));
  });
  return app;
}
