import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import { createApp } from './helpers/app';
import { seedLocalDatabase } from '../src/db/seedData';
import { bootstrapSchema } from '@radiant/shared';
test('bootstrap projects only public settings and one current pricing revision', async () => {
  await seedLocalDatabase(env.DB, true);
  const response = await createApp().request('/public/bootstrap', {}, env);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(bootstrapSchema.safeParse(body).success).toBe(true);
  const text = JSON.stringify(body);
  expect(text).toContain('hello@example.invalid');
  expect(text).not.toContain('inquiries@example.invalid');
  expect(text).not.toContain('owner@example.invalid');
  expect(response.headers.get('Cache-Control')).toBe(
    'public, max-age=0, s-maxage=20, must-revalidate',
  );
});
test('only published image variants can be read, never originals or recovery objects', async () => {
  const id = '01K00000000000000000000001';
  await env.MEDIA.put(`images/${id}/full.webp`, 'synthetic-public');
  await env.MEDIA.put(`originals/${id}/source`, 'synthetic-private');
  const app = createApp();
  expect((await app.request(`/images/${id}/full`, {}, env)).status).toBe(404);
  await env.DB.prepare(
    "INSERT INTO gallery_images (id,tag,alt_text,sort_order,width,height,original_mime,original_bytes,original_width,original_height) VALUES (?,'family','A synthetic family portrait',0,1,1,'image/png',1,1,1)",
  )
    .bind(id)
    .run();
  const image = await app.request(`/images/${id}/full`, {}, env);
  expect(image.status).toBe(200);
  expect(new TextDecoder().decode(await image.arrayBuffer())).toBe('synthetic-public');
  expect(image.headers.get('Content-Type')).toBe('image/webp');
  expect((await app.request(`/images/${id}/original`, {}, env)).status).toBe(400);
  await env.DB.prepare('DELETE FROM gallery_images WHERE id=?').bind(id).run();
  expect((await app.request(`/images/${id}/full`, {}, env)).status).toBe(404);
});
