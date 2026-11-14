import { bannerSchema } from '@radiant/shared';
export async function activeBanner(db: D1Database, now: Date) {
  const row = await db
    .prepare(
      'SELECT id,message,link_url AS linkUrl,starts_at AS startsAt,ends_at AS endsAt FROM banners WHERE starts_at<=? AND ends_at>? ORDER BY starts_at DESC,created_at DESC,id DESC LIMIT 1',
    )
    .bind(now.toISOString(), now.toISOString())
    .first();
  return row ? bannerSchema.parse(row) : null;
}
export async function listBanners(db: D1Database) {
  return (
    await db
      .prepare(
        'SELECT id,message,link_url AS linkUrl,starts_at AS startsAt,ends_at AS endsAt FROM banners ORDER BY starts_at DESC,created_at DESC,id DESC',
      )
      .all()
  ).results.map((row) => bannerSchema.parse(row));
}
