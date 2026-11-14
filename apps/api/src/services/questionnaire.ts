import { ulid } from 'ulid';
import { z } from 'zod';
import {
  questionsSchema,
  answersSchema,
  questionnaireInviteSchema,
  type Question,
} from '@radiant/shared';
import { randomToken, sha256 } from './crypto';
import { ApiFault, validate } from '../middleware/validate';
import { getClient } from './clients';
export async function listQuestions(db: D1Database): Promise<Question[]> {
  const rows = await db
    .prepare(
      'SELECT id,prompt,kind,options,required,sort_order AS sortOrder FROM questionnaire_questions ORDER BY sort_order,id',
    )
    .all<{
      id: string;
      prompt: string;
      kind: string;
      options: string | null;
      required: number;
      sortOrder: number;
    }>();
  return questionsSchema.parse(
    rows.results.map((row) => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : null,
      required: Boolean(row.required),
    })),
  );
}
export async function createInvitation(db: D1Database, clientId: string, now: Date) {
  await getClient(db, clientId);
  const questions = await listQuestions(db);
  if (!questions.length)
    throw new ApiFault(
      400,
      'questionnaire_empty',
      'Add at least one question before sending an invitation.',
    );
  const token = randomToken(),
    id = ulid(),
    sentAt = now.toISOString(),
    expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
  await db
    .prepare(
      'INSERT INTO questionnaire_invites (id,client_id,token_hash,questions_snapshot,sent_at,expires_at) VALUES (?,?,?,?,?,?)',
    )
    .bind(id, clientId, await sha256(token), JSON.stringify(questions), sentAt, expiresAt)
    .run();
  return { id, token };
}
export async function getInvitation(db: D1Database, clientId: string, id: string, now: Date) {
  const row = await db
    .prepare(
      'SELECT i.id,i.sent_at AS sentAt,i.expires_at AS expiresAt,i.submitted_at AS submittedAt,i.questions_snapshot AS questionsSnapshot,r.answers FROM questionnaire_invites i LEFT JOIN questionnaire_responses r ON r.invite_id=i.id WHERE i.id=? AND i.client_id=?',
    )
    .bind(id, clientId)
    .first<{
      id: string;
      sentAt: string;
      expiresAt: string;
      submittedAt: string | null;
      questionsSnapshot: string;
      answers: string | null;
    }>();
  if (!row) throw new ApiFault(404, 'not_found', 'This invitation was not found for this client.');
  return questionnaireInviteSchema.parse({
    ...row,
    status: row.submittedAt
      ? 'submitted'
      : row.expiresAt <= now.toISOString()
        ? 'expired'
        : 'pending',
    questionsSnapshot: JSON.parse(row.questionsSnapshot),
    answers: row.answers ? JSON.parse(row.answers) : null,
  });
}
async function publicInvitation(db: D1Database, token: string) {
  validate(z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'This questionnaire link is invalid.'), token);
  const row = await db
    .prepare(
      'SELECT i.id,i.questions_snapshot AS questionsSnapshot,i.expires_at AS expiresAt,i.submitted_at AS submittedAt,c.first_name AS clientFirstName FROM questionnaire_invites i JOIN clients c ON c.id=i.client_id WHERE i.token_hash=?',
    )
    .bind(await sha256(token))
    .first<{
      id: string;
      questionsSnapshot: string;
      expiresAt: string;
      submittedAt: string | null;
      clientFirstName: string;
    }>();
  if (!row) throw new ApiFault(404, 'not_found', 'This questionnaire is not available.');
  return row;
}
export async function publicQuestionnaire(db: D1Database, token: string, now: Date) {
  const row = await publicInvitation(db, token);
  const status = row.submittedAt
    ? 'submitted'
    : row.expiresAt <= now.toISOString()
      ? 'expired'
      : 'pending';
  return {
    clientFirstName: row.clientFirstName,
    status,
    questions: status === 'pending' ? questionsSchema.parse(JSON.parse(row.questionsSnapshot)) : [],
  };
}
export async function submitQuestionnaire(db: D1Database, token: string, now: Date, body: unknown) {
  const row = await publicInvitation(db, token);
  const submittedAt = now.toISOString();
  if (row.submittedAt || row.expiresAt <= submittedAt)
    throw new ApiFault(
      409,
      'questionnaire_closed',
      'This questionnaire has already been submitted or has expired.',
    );
  const input = validate(
    z.strictObject({
      answers: answersSchema(questionsSchema.parse(JSON.parse(row.questionsSnapshot))),
    }),
    body,
  );
  const result = await db.batch([
    db
      .prepare(
        'INSERT INTO questionnaire_responses (invite_id,answers,submitted_at) SELECT id,?,? FROM questionnaire_invites WHERE id=? AND submitted_at IS NULL AND expires_at>?',
      )
      .bind(JSON.stringify(input.answers), submittedAt, row.id, submittedAt),
    db
      .prepare(
        'UPDATE questionnaire_invites SET submitted_at=? WHERE id=? AND submitted_at IS NULL AND EXISTS (SELECT 1 FROM questionnaire_responses WHERE invite_id=?)',
      )
      .bind(submittedAt, row.id, row.id),
  ]);
  if (result[0]!.meta.changes !== 1)
    throw new ApiFault(
      409,
      'questionnaire_closed',
      'This questionnaire has already been submitted or has expired.',
    );
}
