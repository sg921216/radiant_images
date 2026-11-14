import { Hono } from 'hono';
import { z } from 'zod';
import { idSchema } from '@radiant/shared';
import type { AppEnv } from '../env';
import { ApiFault, validate } from '../middleware/validate';
export const imageRoutes = new Hono<AppEnv>();
imageRoutes.get('/:id/:variant', async (c) => {
  const id = validate(idSchema, c.req.param('id'));
  const variant = validate(z.enum(['full', 'card', 'thumb']), c.req.param('variant'));
  if (!(await c.env.DB.prepare('SELECT id FROM gallery_images WHERE id=?').bind(id).first()))
    throw new ApiFault(404, 'not_found', 'This image was not found.');
  const object = await c.env.MEDIA.get(`images/${id}/${variant}.webp`);
  if (!object) throw new ApiFault(404, 'not_found', 'This image was not found.');
  c.header('Content-Type', 'image/webp');
  c.header('Cache-Control', 'public, max-age=20, must-revalidate');
  c.header('ETag', object.httpEtag);
  return c.body(object.body);
});
