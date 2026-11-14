import { Hono } from 'hono';
import { pricingDraftSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { validate, jsonBody } from '../../middleware/validate';
import { currentPricing, publishPricing } from '../../services/pricing';
export function pricingRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/', async (c) => c.json(await currentPricing(c.env.DB)));
  app.put('/', async (c) => {
    const draft = validate(pricingDraftSchema, await jsonBody(c.req.raw));
    return c.json(
      await publishPricing(
        c.env.DB,
        draft,
        c.get('owner').email,
        c.get('requestId'),
        runtime.now(),
      ),
    );
  });
  return app;
}
