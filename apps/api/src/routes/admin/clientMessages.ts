import { Hono } from 'hono';
import { idSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { jsonBody, validate } from '../../middleware/validate';
import { sendClientMessage } from '../../services/clientMessages';
import { getInvitation } from '../../services/questionnaire';
export function clientMessageRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.post('/:id/emails', async (c) =>
    c.json(
      await sendClientMessage(
        c.env,
        runtime,
        validate(idSchema, c.req.param('id')),
        await jsonBody(c.req.raw),
        c.get('owner').email,
        c.get('requestId'),
      ),
      201,
    ),
  );
  app.post('/:id/questionnaires', async (c) => {
    const id = validate(idSchema, c.req.param('id'));
    const message = await sendClientMessage(
      c.env,
      runtime,
      id,
      {
        subject: 'Your Radiant Images session questionnaire',
        body: 'Hello {{firstName}},\n\nPlease tell us about your session using this private questionnaire:\n{{questionnaireLink}}\n\nThis link expires after 30 days and accepts one submission.',
      },
      c.get('owner').email,
      c.get('requestId'),
    );
    return c.json(
      await getInvitation(c.env.DB, id, message.questionnaireInviteId!, runtime.now()),
      201,
    );
  });
  return app;
}
