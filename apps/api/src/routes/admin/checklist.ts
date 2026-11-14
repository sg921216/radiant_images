import { Hono } from 'hono';
import { z } from 'zod';
import { checklistSchema, idSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { ApiFault, validate, jsonBody } from '../../middleware/validate';
import { auditedMutation } from '../../services/mutation';
import { listChecklist, checklistReplacement } from '../../services/checklist';
export function checklistRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/checklist', async (c) => c.json(await listChecklist(c.env.DB)));
  app.put('/checklist', async (c) => {
    const items = validate(checklistSchema, await jsonBody(c.req.raw));
    await auditedMutation(
      c.env.DB,
      checklistReplacement(c.env.DB, items, runtime.now().toISOString()),
      {
        actor: c.get('owner').email,
        action: 'checklist.saved',
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(await listChecklist(c.env.DB));
  });
  app.put('/clients/:id/checklist/:itemId', async (c) => {
    const clientId = validate(idSchema, c.req.param('id')),
      itemId = validate(idSchema, c.req.param('itemId'));
    const { completed } = validate(
      z.strictObject({ completed: z.boolean() }),
      await jsonBody(c.req.raw),
    );
    const row = await c.env.DB.prepare(
      'SELECT s.item_id AS itemId,i.label FROM client_checklist_state s JOIN checklist_items i ON i.id=s.item_id WHERE s.client_id=? AND s.item_id=?',
    )
      .bind(clientId, itemId)
      .first<{ itemId: string; label: string }>();
    if (!row)
      throw new ApiFault(404, 'not_found', 'This checklist item was not found for this client.');
    const completedAt = completed ? runtime.now().toISOString() : null;
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'UPDATE client_checklist_state SET completed_at=? WHERE client_id=? AND item_id=?',
        ).bind(completedAt, clientId, itemId),
      ],
      {
        actor: c.get('owner').email,
        action: 'client.checklist_changed',
        entityType: 'client',
        entityId: clientId,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json({ ...row, completedAt });
  });
  return app;
}
