import { ulid } from 'ulid';
import { SHOOT_TYPES, type PricingDraft, type PricingRevision } from '@radiant/shared';
import { auditedMutation } from './mutation';
export { currentPricing } from './publicContent';
export async function publishPricing(
  db: D1Database,
  draft: PricingDraft,
  actor: string,
  requestId: string,
  now: Date,
): Promise<PricingRevision> {
  const revisionId = ulid();
  const publishedAt = now.toISOString();
  const packages = SHOOT_TYPES.flatMap((type) =>
    draft.packages
      .filter((p) => p.shootType === type)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p, index) => ({ ...p, id: ulid(), sortOrder: index })),
  );
  await auditedMutation(
    db,
    [
      db
        .prepare('INSERT INTO pricing_revisions (id,published_at,created_by) VALUES (?,?,?)')
        .bind(revisionId, publishedAt, actor),
      ...packages.map((p) =>
        db
          .prepare(
            'INSERT INTO pricing_packages (id,revision_id,shoot_type,sort_order,name,price_cents,description,inclusions) VALUES (?,?,?,?,?,?,?,?)',
          )
          .bind(
            p.id,
            revisionId,
            p.shootType,
            p.sortOrder,
            p.name,
            p.priceCents,
            p.description,
            JSON.stringify(p.inclusions),
          ),
      ),
      db
        .prepare(
          'INSERT INTO pricing_publication (id,current_revision_id) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET current_revision_id=excluded.current_revision_id',
        )
        .bind(revisionId),
    ],
    {
      actor,
      action: 'pricing.published',
      entityType: 'pricing_revision',
      entityId: revisionId,
      outcome: 'ok',
      requestId,
      detail: { count: packages.length },
    },
  );
  return { revisionId, publishedAt, packages };
}
