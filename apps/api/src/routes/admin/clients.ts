import { Hono } from 'hono';
import { ulid } from 'ulid';
import { z } from 'zod';
import { clientInputSchema, clientSchema, idSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { validate, jsonBody } from '../../middleware/validate';
import { auditedMutation } from '../../services/mutation';
import { getClient, clientDetail, clientColumns } from '../../services/clients';
import { ensureDeletionLedger, deleteClient } from '../../services/clientDeletion';
export function clientRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/', async (c) => {
    const query = validate(z.string().trim().max(200), c.req.query('q') ?? '');
    const rows = await c.env.DB.prepare(
      `SELECT ${clientColumns} FROM clients WHERE instr(lower(first_name),lower(?))>0 OR instr(lower(last_name),lower(?))>0 OR instr(lower(email),lower(?))>0 ORDER BY last_name,first_name,id`,
    )
      .bind(query, query, query)
      .all();
    return c.json(rows.results.map((row) => clientSchema.parse(row)));
  });
  app.post('/', async (c) => {
    const input = validate(clientInputSchema, await jsonBody(c.req.raw));
    await ensureDeletionLedger(c.env);
    const id = ulid(),
      now = runtime.now().toISOString();
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'INSERT INTO clients (id,first_name,last_name,email,phone,shoot_type,session_date,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        ).bind(
          id,
          input.firstName,
          input.lastName,
          input.email,
          input.phone,
          input.shootType,
          input.sessionDate,
          input.notes,
          now,
          now,
        ),
        c.env.DB.prepare(
          'INSERT INTO client_checklist_state (client_id,item_id,completed_at) SELECT ?,id,NULL FROM checklist_items',
        ).bind(id),
      ],
      {
        actor: c.get('owner').email,
        action: 'client.created',
        entityType: 'client',
        entityId: id,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(await getClient(c.env.DB, id), 201);
  });
  app.get('/:id', async (c) =>
    c.json(await clientDetail(c.env.DB, validate(idSchema, c.req.param('id')), runtime.now())),
  );
  app.put('/:id', async (c) => {
    const id = validate(idSchema, c.req.param('id'));
    await getClient(c.env.DB, id);
    const input = validate(clientInputSchema, await jsonBody(c.req.raw));
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'UPDATE clients SET first_name=?,last_name=?,email=?,phone=?,shoot_type=?,session_date=?,notes=?,updated_at=? WHERE id=?',
        ).bind(
          input.firstName,
          input.lastName,
          input.email,
          input.phone,
          input.shootType,
          input.sessionDate,
          input.notes,
          runtime.now().toISOString(),
          id,
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'client.edited',
        entityType: 'client',
        entityId: id,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(await getClient(c.env.DB, id));
  });
  app.delete('/:id', async (c) => {
    await deleteClient(
      c.env,
      validate(idSchema, c.req.param('id')),
      runtime.now(),
      c.get('owner').email,
      c.get('requestId'),
    );
    return c.body(null, 204);
  });
  return app;
}
