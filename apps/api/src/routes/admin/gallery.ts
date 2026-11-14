import { Hono } from 'hono';
import { galleryEditSchema, orderSchema, idSchema } from '@radiant/shared';
import type { AppEnv } from '../../env';
import type { Runtime } from '../../services/runtime';
import { validate, jsonBody, ApiFault } from '../../middleware/validate';
import { listGallery, getGalleryImage, uploadImage, deleteImage } from '../../services/images';
import { auditedMutation } from '../../services/mutation';
export function galleryRoutes(runtime: Runtime) {
  const app = new Hono<AppEnv>();
  app.get('/', async (c) => c.json(await listGallery(c.env)));
  app.post('/', async (c) => {
    let form: FormData;
    try {
      form = await c.req.raw.formData();
    } catch {
      throw new ApiFault(400, 'invalid_image', 'Choose a complete image upload.');
    }
    return c.json(
      await uploadImage(c.env, runtime, form, c.get('owner').email, c.get('requestId')),
      201,
    );
  });
  app.put('/order', async (c) => {
    const { ids } = validate(orderSchema, await jsonBody(c.req.raw));
    const current = await listGallery(c.env);
    if (ids.length !== current.length || current.some((image) => !ids.includes(image.id)))
      throw new ApiFault(400, 'invalid_order', 'Reload the gallery and order the complete list.');
    const guard = ids.length
      ? `(SELECT COUNT(*) FROM gallery_images WHERE id IN (${ids.map(() => '?').join(',')}))=${ids.length}`
      : '(SELECT COUNT(*) FROM gallery_images)=0';
    try {
      await auditedMutation(
        c.env.DB,
        [
          c.env.DB.prepare(
            `UPDATE gallery_images SET sort_order=CASE WHEN (SELECT COUNT(*) FROM gallery_images)=${ids.length} AND ${guard} THEN -sort_order-1 ELSE NULL END`,
          ).bind(...ids),
          ...ids.map((id, index) =>
            c.env.DB.prepare('UPDATE gallery_images SET sort_order=?,updated_at=? WHERE id=?').bind(
              index,
              runtime.now().toISOString(),
              id,
            ),
          ),
        ],
        {
          actor: c.get('owner').email,
          action: 'gallery.reordered',
          outcome: 'ok',
          requestId: c.get('requestId'),
        },
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('NOT NULL'))
        throw new ApiFault(400, 'invalid_order', 'The gallery changed. Reload before reordering.');
      throw error;
    }
    return c.body(null, 204);
  });
  app.patch('/:id', async (c) => {
    const id = validate(idSchema, c.req.param('id'));
    const input = validate(galleryEditSchema, await jsonBody(c.req.raw));
    await getGalleryImage(c.env, id);
    await auditedMutation(
      c.env.DB,
      [
        c.env.DB.prepare(
          'UPDATE gallery_images SET tag=COALESCE(?,tag),alt_text=COALESCE(?,alt_text),updated_at=? WHERE id=?',
        ).bind(input.tag ?? null, input.altText ?? null, runtime.now().toISOString(), id),
      ],
      {
        actor: c.get('owner').email,
        action: 'gallery.edited',
        entityType: 'image',
        entityId: id,
        outcome: 'ok',
        requestId: c.get('requestId'),
      },
    );
    return c.json(await getGalleryImage(c.env, id));
  });
  app.delete('/:id', async (c) => {
    await deleteImage(
      c.env,
      runtime,
      validate(idSchema, c.req.param('id')),
      c.get('owner').email,
      c.get('requestId'),
    );
    return c.body(null, 204);
  });
  return app;
}
