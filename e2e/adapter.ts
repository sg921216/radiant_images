import type { Env } from '../apps/api/src/env';
import { seedLocalDatabase } from '../apps/api/src/db/seedData';
import { assertLocalTarget } from '../scripts/local-target';
export async function resetSynthetic(env: Env): Promise<void> {
  assertLocalTarget(env.WEB_ORIGIN);
  assertLocalTarget(env.API_ORIGIN);
  await env.DB.exec(
    'DROP TRIGGER IF EXISTS synthetic_checklist_failure; DROP TRIGGER IF EXISTS synthetic_history_failure;',
  );
  const tables = [
    'client_emails',
    'questionnaire_responses',
    'questionnaire_invites',
    'client_checklist_state',
    'clients',
    'questionnaire_questions',
    'checklist_items',
    'email_templates',
    'pricing_publication',
    'pricing_packages',
    'pricing_revisions',
    'gallery_images',
    'banners',
    'faq_entries',
    'page_content',
    'site_config',
    'inquiry_dedupe',
    'rate_limit_windows',
    'sessions',
    'oauth_states',
    'exchange_codes',
    'audit_events',
  ];
  await env.DB.batch(tables.map((table) => env.DB.prepare(`DELETE FROM ${table}`)));
  for (const bucket of [env.MEDIA, env.RECOVERY]) {
    let cursor: string | undefined;
    do {
      const page = await bucket.list(cursor ? { cursor } : {});
      if (page.objects.length) await bucket.delete(page.objects.map((x) => x.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }
  await seedLocalDatabase(env.DB, true);
  await env.DB.prepare(
    'UPDATE lifecycle_state SET initialized=0,restore_status=0,ledger_id=lower(hex(randomblob(16))) WHERE id=1',
  ).run();
}
