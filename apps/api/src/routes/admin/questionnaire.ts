import { Hono } from 'hono';
import { questionsSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { jsonBody, validate } from '../../middleware/validate';
import { listQuestions } from '../../services/questionnaire';
import { auditedMutation } from '../../services/mutation';
export function questionMasterRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/', async (c) => c.json(await listQuestions(c.env.DB)));
  app.put('/', async (c) => {
    const items = validate(questionsSchema, await jsonBody(c.req.raw));
    const now = runtime.now().toISOString();
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare('DELETE FROM questionnaire_questions'),
        ...items.map((item) =>
          c.env.DB.prepare(
            'INSERT INTO questionnaire_questions (id,prompt,kind,options,required,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
          ).bind(
            item.id,
            item.prompt,
            item.kind,
            item.options ? JSON.stringify(item.options) : null,
            item.required ? 1 : 0,
            item.sortOrder,
            now,
            now,
          ),
        ),
      ],
      {
        actor: c.get('owner').email,
        action: 'questionnaire.saved',
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(await listQuestions(c.env.DB));
  });
  return app;
}
