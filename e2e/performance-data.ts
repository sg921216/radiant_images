import type { Env } from '../apps/api/src/env';
import { assertLocalTarget } from '../scripts/local-target';
import { randomToken, sha256 } from '../apps/api/src/services/crypto';
import { redeemGrant } from '../apps/api/src/services/session';
import { createInvitation } from '../apps/api/src/services/questionnaire';
const fixtureId = (prefix: string, n: number) =>
  `${prefix}${String(n).padStart(26 - prefix.length, '0')}`;
export async function seedPerformanceData(
  env: Env,
  now: Date,
): Promise<{ ownerToken: string; questionnaireToken: string; clientId: string }> {
  assertLocalTarget(env.WEB_ORIGIN);
  assertLocalTarget(env.API_ORIGIN);
  const statements: D1PreparedStatement[] = [];
  for (let index = 0; index < 200; index++)
    statements.push(
      env.DB.prepare(
        "INSERT INTO clients(id,first_name,last_name,email,shoot_type,notes) VALUES (?,'Synthetic',?,?,?,'Performance fixture only')",
      ).bind(
        fixtureId('01C', index),
        `Client ${index}`,
        `fixture-${index}@example.invalid`,
        ['maternity', 'newborn', 'family'][index % 3],
      ),
    );
  for (let index = 0; index < 10; index++)
    statements.push(
      env.DB.prepare(
        'INSERT INTO questionnaire_questions(id,prompt,kind,options,required,sort_order) VALUES (?,?,?,?,1,?)',
      ).bind(
        fixtureId('01Q', index),
        `Session preference ${index + 1}`,
        index < 4 ? 'short_text' : index < 7 ? 'long_text' : 'single_choice',
        index < 7 ? null : JSON.stringify(['Studio', 'Garden', 'Park', 'Beach']),
        index,
      ),
    );
  for (let index = 0; index < 2; index++)
    statements.push(
      env.DB.prepare('INSERT INTO checklist_items(id,label,sort_order) VALUES (?,?,?)').bind(
        fixtureId('01K', index),
        ['Planning', 'Delivery'][index],
        index,
      ),
    );
  statements.push(
    env.DB.prepare(
      'INSERT INTO client_checklist_state(client_id,item_id) SELECT c.id,i.id FROM clients c CROSS JOIN checklist_items i',
    ),
  );
  statements.push(
    env.DB.prepare(
      "INSERT INTO email_templates(id,name,subject,body,sort_order) VALUES (?,'Welcome','Hello {{firstName}}','We look forward to planning your {{shootType}} session.',0)",
    ).bind(fixtureId('01T', 0)),
  );
  const revision = await env.DB.prepare(
    'SELECT current_revision_id AS id FROM pricing_publication',
  ).first<{ id: string }>();
  statements.push(env.DB.prepare('DELETE FROM pricing_packages'));
  for (const [index, type] of ['maternity', 'newborn', 'family'].entries())
    for (let n = 0; n < 3; n++)
      statements.push(
        env.DB.prepare(
          'INSERT INTO pricing_packages(id,revision_id,shoot_type,sort_order,name,price_cents,description,inclusions) VALUES (?,?,?,?,?,?,?,?)',
        ).bind(
          fixtureId('01P', index * 3 + n),
          revision!.id,
          type,
          n,
          `${['Essential', 'Story', 'Collection'][n]} session`,
          25000 + n * 10000,
          'Time to relax, connect and create a thoughtful collection of photographs.',
          JSON.stringify([
            'Session planning',
            'A relaxed photography session',
            'A curated digital gallery',
          ]),
        ),
      );
  statements.push(
    env.DB.prepare('INSERT INTO banners(id,message,starts_at,ends_at) VALUES (?,?,?,?)').bind(
      fixtureId('01B', 0),
      'Plan a relaxed session for your family.',
      new Date(now.getTime() - 3600000).toISOString(),
      new Date(now.getTime() + 86400000).toISOString(),
    ),
  );
  for (const page of ['about', 'maternity', 'newborn', 'family'])
    statements.push(
      env.DB.prepare('UPDATE page_content SET intro_md=?,how_it_works=? WHERE page=?').bind(
        'A relaxed photography experience that leaves room for connection. Together we plan the setting, timing and details so your session feels comfortable. Browse the collection, compare the session options and share what matters to you.',
        JSON.stringify(
          [
            'Tell us about the photographs you hope to create.',
            'Choose a setting and time that suit your family.',
            'Enjoy a relaxed session with thoughtful guidance.',
            'Receive your curated gallery and choose your favorites.',
          ].map((body, index) => ({
            title: ['Plan', 'Prepare', 'Your session', 'Your gallery'][index],
            body,
          })),
        ),
        page,
      ),
    );
  await env.DB.batch(statements);
  const code = randomToken();
  await env.DB.prepare(
    'INSERT INTO exchange_codes(code_hash,owner_email,expires_at) VALUES (?,?,?)',
  )
    .bind(
      await sha256(code),
      'owner@example.invalid',
      new Date(now.getTime() + 60000).toISOString(),
    )
    .run();
  const session = await redeemGrant(env, code, now),
    clientId = fixtureId('01C', 0),
    invite = await createInvitation(env.DB, clientId, now);
  return { ownerToken: session.token, questionnaireToken: invite.token, clientId };
}
