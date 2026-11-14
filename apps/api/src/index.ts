import { authRoutes } from './routes/auth';
import { publicRoutes } from './routes/public';
import { imageRoutes } from './routes/images';
import { inquiryRoutes } from './routes/inquiries';
import { contentRoutes } from './routes/admin/content';
import { pricingRoutes } from './routes/admin/pricing';
import { galleryRoutes } from './routes/admin/gallery';
import { bannerRoutes } from './routes/admin/banners';
import { configRoutes } from './routes/admin/config';
import { clientRoutes } from './routes/admin/clients';
import { checklistRoutes } from './routes/admin/checklist';
import { templateRoutes } from './routes/admin/templates';
import { questionMasterRoutes } from './routes/admin/questionnaire';
import { clientMessageRoutes } from './routes/admin/clientMessages';
import { questionnaireRoutes } from './routes/questionnaire';
import { currentPricing } from './services/pricing';
import { requireOwner } from './middleware/requireOwner';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { LIMITS } from '@radiant/shared';
import type { AppEnv } from './env';
import { ApiFault } from './middleware/validate';
import { rateLimit } from './middleware/rateLimit';
import { productionRuntime, type Runtime } from './services/runtime';
import { fallbackAudit } from './services/audit';
import { restoreStatus } from './services/backup';
import { scheduled } from './scheduled';
export { JpegValidator } from './services/jpegValidator';
export function createApp(runtime: Runtime = productionRuntime) {
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    c.header('X-Request-Id', c.get('requestId'));
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Cache-Control', 'no-store');
    c.header(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    c.header('Strict-Transport-Security', 'max-age=31536000');
    if (await restoreStatus(c.env))
      return c.json(
        { error: { code: 'maintenance', message: 'The website is temporarily unavailable.' } },
        503,
      );
    await next();
  });
  app.use(
    '*',
    cors({
      origin: (origin, c) => (origin === c.env.WEB_ORIGIN ? origin : ''),
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: false,
      maxAge: 600,
    }),
  );
  app.use('*', async (c, next) => {
    if (c.req.raw.body && !['GET', 'HEAD'].includes(c.req.method)) {
      const limit =
        c.req.path === '/admin/gallery' && c.req.method === 'POST'
          ? LIMITS.uploadBytes
          : LIMITS.jsonBytes;
      const declared = Number(c.req.header('Content-Length') ?? 0);
      if (declared > limit)
        throw new ApiFault(413, 'payload_too_large', 'The request is too large.');
      const reader = c.req.raw.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > limit) {
          await reader.cancel();
          throw new ApiFault(413, 'payload_too_large', 'The request is too large.');
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      c.req.raw = new Request(c.req.raw, { body: bytes });
    }
    await next();
  });
  app.use('/inquiries', async (c, next) =>
    c.req.method === 'POST' ? rateLimit(runtime, 'inquiry', 5, 600)(c, next) : next(),
  );
  app.use('/auth/google/*', rateLimit(runtime, 'auth', 10, 600));
  app.use('/auth/exchange', rateLimit(runtime, 'auth', 10, 600));
  app.use('/questionnaire/:token', async (c, next) =>
    c.req.method === 'POST' ? rateLimit(runtime, 'questionnaire', 5, 600)(c, next) : next(),
  );
  app.notFound((c) =>
    c.json({ error: { code: 'not_found', message: 'This resource was not found.' } }, 404),
  );
  app.onError((error, c) => {
    if (error instanceof ApiFault)
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.fields ? { fields: error.fields } : {}),
            ...(error.retryable === undefined ? {} : { retryable: error.retryable }),
          },
        },
        error.status,
      );
    fallbackAudit(
      { action: 'request.failed', outcome: 'error', requestId: c.get('requestId') },
      'internal_error',
    );
    return c.json(
      {
        error: { code: 'internal_error', message: 'Something went wrong. Please try again later.' },
      },
      500,
    );
  });
  app.use('/admin/*', requireOwner(runtime, true));
  app.route('/auth', authRoutes(runtime));
  app.route('/public', publicRoutes(runtime));
  app.route('/images', imageRoutes);
  app.route('/inquiries', inquiryRoutes(runtime));
  app.route('/admin', contentRoutes(runtime));
  app.route('/admin/pricing', pricingRoutes(runtime));
  app.route('/admin/gallery', galleryRoutes(runtime));
  app.route('/admin/banners', bannerRoutes(runtime));
  app.route('/admin/config', configRoutes(runtime));
  app.route('/admin/clients', clientRoutes(runtime));
  app.route('/admin', checklistRoutes(runtime));
  app.route('/admin/templates', templateRoutes(runtime));
  app.route('/admin/questionnaire', questionMasterRoutes(runtime));
  app.route('/admin/clients', clientMessageRoutes(runtime));
  app.route('/questionnaire', questionnaireRoutes(runtime));
  app.get('/pricing', async (c) => {
    const pricing = await currentPricing(c.env.DB);
    c.header('Cache-Control', 'public, max-age=0, s-maxage=20, must-revalidate');
    return c.json(pricing);
  });
  return app;
}
const app = createApp();
export default { fetch: app.fetch, scheduled };
