import { clientSchema, type Client } from '@radiant/shared';
import { ApiFault } from '../middleware/validate';
export const clientColumns =
  'id,first_name AS firstName,last_name AS lastName,email,phone,shoot_type AS shootType,session_date AS sessionDate,notes,created_at AS createdAt';
export async function getClient(db: D1Database, id: string): Promise<Client> {
  const row = await db.prepare(`SELECT ${clientColumns} FROM clients WHERE id=?`).bind(id).first();
  if (!row) throw new ApiFault(404, 'not_found', 'This client was not found.');
  return clientSchema.parse(row);
}
export async function clientDetail(db: D1Database, id: string, now: Date) {
  const client = await getClient(db, id);
  const [emails, checklist, invites] = await Promise.all([
    db
      .prepare(
        'SELECT id,template_id AS templateId,questionnaire_invite_id AS questionnaireInviteId,subject,body,sent_at AS sentAt FROM client_emails WHERE client_id=? ORDER BY sent_at DESC,id DESC',
      )
      .bind(id)
      .all(),
    db
      .prepare(
        'SELECT s.item_id AS itemId,i.label,s.completed_at AS completedAt FROM client_checklist_state s JOIN checklist_items i ON i.id=s.item_id WHERE s.client_id=? ORDER BY i.sort_order,i.id',
      )
      .bind(id)
      .all(),
    db
      .prepare(
        'SELECT i.id,i.sent_at AS sentAt,i.expires_at AS expiresAt,i.submitted_at AS submittedAt,i.questions_snapshot AS questionsSnapshot,r.answers FROM questionnaire_invites i LEFT JOIN questionnaire_responses r ON r.invite_id=i.id WHERE i.client_id=? ORDER BY i.sent_at DESC,i.id DESC',
      )
      .bind(id)
      .all<{
        id: string;
        sentAt: string;
        expiresAt: string;
        submittedAt: string | null;
        questionsSnapshot: string;
        answers: string | null;
      }>(),
  ]);
  return {
    ...client,
    emails: emails.results,
    checklist: checklist.results,
    questionnaires: invites.results.map((invite) => ({
      ...invite,
      questionsSnapshot: JSON.parse(invite.questionsSnapshot),
      answers: invite.answers ? JSON.parse(invite.answers) : null,
      status: invite.submittedAt
        ? 'submitted'
        : invite.expiresAt <= now.toISOString()
          ? 'expired'
          : 'pending',
    })),
  };
}
