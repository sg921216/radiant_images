import { ulid } from 'ulid';
import {
  sendEmailSchema,
  expandTemplate,
  hasQuestionnaireUrl,
  OMITTED_QUESTIONNAIRE_LINK,
} from '@radiant/shared';
import type { Env } from '../env';
import type { Runtime } from './runtime';
import { ApiFault, validate } from '../middleware/validate';
import { getClient } from './clients';
import { createInvitation } from './questionnaire';
import { sendEmail } from './email';
import { auditedMutation } from './mutation';
import { fallbackAudit } from './audit';
export async function sendClientMessage(
  env: Env,
  runtime: Runtime,
  clientId: string,
  body: unknown,
  actor: string,
  requestId: string,
) {
  const input = validate(sendEmailSchema(env.WEB_ORIGIN), body);
  const client = await getClient(env.DB, clientId);
  if (
    input.templateId &&
    !(await env.DB.prepare('SELECT id FROM email_templates WHERE id=?')
      .bind(input.templateId)
      .first())
  )
    throw new ApiFault(404, 'not_found', 'This email template was not found.');
  const needsInvitation =
    input.subject.includes('{{questionnaireLink}}') || input.body.includes('{{questionnaireLink}}');
  let invitation: { id: string; token: string } | undefined;
  let sender: string;
  try {
    const config = await env.DB.prepare('SELECT sender_address FROM site_config WHERE id=1').first<{
      sender_address: string;
    }>();
    if (!config) throw new Error('Missing sender');
    sender = config.sender_address;
    if (needsInvitation) invitation = await createInvitation(env.DB, clientId, runtime.now());
  } catch (error) {
    if (error instanceof ApiFault) throw error;
    throw new ApiFault(
      502,
      'email_not_sent',
      'The email could not be prepared. No email was sent.',
      undefined,
      true,
    );
  }
  const link = invitation ? `${env.WEB_ORIGIN}/q/${invitation.token}` : '';
  const subject = expandTemplate(input.subject, client, link),
    message = expandTemplate(input.body, client, link);
  const historySubject = expandTemplate(input.subject, client, OMITTED_QUESTIONNAIRE_LINK),
    historyBody = expandTemplate(input.body, client, OMITTED_QUESTIONNAIRE_LINK);
  if (
    hasQuestionnaireUrl(historySubject, env.WEB_ORIGIN) ||
    hasQuestionnaireUrl(historyBody, env.WEB_ORIGIN) ||
    subject.length > 200 ||
    /[\r\n\0]/.test(subject)
  ) {
    if (invitation)
      await env.DB.prepare('DELETE FROM questionnaire_invites WHERE id=?')
        .bind(invitation.id)
        .run();
    throw new ApiFault(
      400,
      'message_invalid',
      'Check the expanded subject and use {{questionnaireLink}} for questionnaire links.',
    );
  }
  const outcome = await sendEmail(env, runtime, {
    from: sender,
    to: client.email,
    replyTo: sender,
    subject,
    body: message,
  });
  if (outcome.kind === 'not_sent') {
    if (invitation) {
      try {
        await env.DB.prepare('DELETE FROM questionnaire_invites WHERE id=?')
          .bind(invitation.id)
          .run();
      } catch {
        fallbackAudit(
          { action: 'questionnaire.cleanup', outcome: 'error', requestId },
          'invite_cleanup_failed',
        );
      }
    }
    throw new ApiFault(
      502,
      'email_not_sent',
      'The email was not sent. Check the settings before trying again.',
      undefined,
      true,
    );
  }
  if (outcome.kind === 'unknown') {
    fallbackAudit(
      { action: 'client.email_unknown', outcome: 'error', requestId },
      'email_outcome_unknown',
    );
    throw new ApiFault(
      504,
      'email_outcome_unknown',
      'The email may have been sent. Check the mailbox and client history before sending again.',
      undefined,
      false,
    );
  }
  const history = {
    id: ulid(),
    templateId: input.templateId ?? null,
    questionnaireInviteId: invitation?.id ?? null,
    subject: historySubject,
    body: historyBody,
    sentAt: runtime.now().toISOString(),
  };
  try {
    await auditedMutation(
      env.DB,
      [
        env.DB.prepare(
          'INSERT INTO client_emails (id,client_id,template_id,questionnaire_invite_id,subject,body,gmail_message_id,sent_at) VALUES (?,?,?,?,?,?,?,?)',
        ).bind(
          history.id,
          clientId,
          history.templateId,
          history.questionnaireInviteId,
          history.subject,
          history.body,
          outcome.providerId,
          history.sentAt,
        ),
      ],
      {
        actor,
        action: 'client.email_sent',
        entityType: 'client',
        entityId: clientId,
        outcome: 'ok',
        requestId,
      },
    );
  } catch {
    fallbackAudit(
      { action: 'client.email_history', outcome: 'error', requestId },
      'email_history_failed',
    );
    throw new ApiFault(
      500,
      'email_history_failed',
      'Gmail accepted the email, but its history could not be saved. Check the mailbox and reconcile the history. Do not resend to repair the record.',
      undefined,
      false,
    );
  }
  return history;
}
