import {
  bootstrapSchema,
  pricingRevisionSchema,
  type PricingRevision,
  type PublicBootstrap,
} from '@radiant/shared';
import type { Env } from '../env';
import { ApiFault } from '../middleware/validate';
import { activeBanner } from './banners';
export async function currentPricing(db: D1Database): Promise<PricingRevision> {
  const rows = await db
    .prepare(
      "SELECT r.id AS revisionId,r.published_at AS publishedAt,p.id,p.shoot_type AS shootType,p.sort_order AS sortOrder,p.name,p.price_cents AS priceCents,p.description,p.inclusions FROM pricing_publication c JOIN pricing_revisions r ON r.id=c.current_revision_id JOIN pricing_packages p ON p.revision_id=r.id WHERE c.id=1 ORDER BY CASE p.shoot_type WHEN 'maternity' THEN 0 WHEN 'newborn' THEN 1 ELSE 2 END,p.sort_order",
    )
    .all<{
      revisionId: string;
      publishedAt: string;
      id: string;
      shootType: string;
      sortOrder: number;
      name: string;
      priceCents: number;
      description: string;
      inclusions: string;
    }>();
  const first = rows.results[0];
  if (!first) throw new ApiFault(500, 'content_unavailable', 'Published content is unavailable.');
  return pricingRevisionSchema.parse({
    revisionId: first.revisionId,
    publishedAt: first.publishedAt,
    packages: rows.results.map(
      ({ revisionId: _revision, publishedAt: _published, inclusions, ...p }) => ({
        ...p,
        inclusions: JSON.parse(inclusions),
      }),
    ),
  });
}
export async function publicContent(env: Env, now: Date): Promise<PublicBootstrap> {
  const [config, gallery, pages, faq, banner, pricing] = await Promise.all([
    env.DB.prepare(
      'SELECT shoot_locations,referral_sources,timezone,public_contact_email FROM site_config WHERE id=1',
    ).first<{
      shoot_locations: string;
      referral_sources: string;
      timezone: string;
      public_contact_email: string;
    }>(),
    env.DB.prepare(
      'SELECT id,tag,alt_text AS altText,sort_order AS sortOrder,width,height FROM gallery_images ORDER BY sort_order',
    ).all<{
      id: string;
      tag: string;
      altText: string;
      sortOrder: number;
      width: number;
      height: number;
    }>(),
    env.DB.prepare(
      'SELECT page,intro_md AS introMd,how_it_works FROM page_content ORDER BY page',
    ).all<{ page: string; introMd: string; how_it_works: string }>(),
    env.DB.prepare(
      'SELECT id,question,answer,sort_order AS sortOrder FROM faq_entries ORDER BY sort_order',
    ).all(),
    activeBanner(env.DB, now),
    currentPricing(env.DB),
  ]);
  if (!config) throw new ApiFault(500, 'content_unavailable', 'Published content is unavailable.');
  return bootstrapSchema.parse({
    config: {
      shootLocations: JSON.parse(config.shoot_locations),
      referralSources: JSON.parse(config.referral_sources),
      timezone: config.timezone,
      publicContactEmail: config.public_contact_email,
    },
    gallery: gallery.results.map((row) => ({
      ...row,
      urls: {
        full: `${env.API_ORIGIN}/images/${row.id}/full`,
        card: `${env.API_ORIGIN}/images/${row.id}/card`,
        thumb: `${env.API_ORIGIN}/images/${row.id}/thumb`,
      },
    })),
    pages: pages.results.map(({ how_it_works, ...page }) => ({
      ...page,
      howItWorks: JSON.parse(how_it_works),
    })),
    faq: faq.results,
    banner,
    pricing,
  });
}
