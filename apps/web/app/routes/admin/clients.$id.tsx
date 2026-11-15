import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  clientInputSchema,
  sendEmailSchema,
  expandTemplate,
  PLACEHOLDERS,
  type Client,
  type ChecklistState,
  type QuestionnaireInvite,
  type EmailTemplate,
} from '@radiant/shared';
import { apiRequest, APIError } from '../../lib/api';
import { AdminLayout } from '../../components/AdminLayout';
import { ClientFields, clientDraft, type ClientDraft } from '../../components/forms/ClientFields';
type ClientEmail = {
  id: string;
  templateId: string | null;
  questionnaireInviteId: string | null;
  subject: string;
  body: string;
  sentAt: string;
};
type Detail = Client & {
  emails: ClientEmail[];
  checklist: ChecklistState[];
  questionnaires: QuestionnaireInvite[];
};
export function ClientDetailEditor({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null),
    [draft, setDraft] = useState<ClientDraft | null>(null),
    [templates, setTemplates] = useState<EmailTemplate[]>([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [remove, setRemove] = useState(false);
  const [templateId, setTemplateId] = useState(''),
    [subject, setSubject] = useState(''),
    [body, setBody] = useState(''),
    [delivery, setDelivery] = useState<'idle' | 'sent' | 'uncertain' | 'history'>('idle'),
    [emailStatus, setEmailStatus] = useState(''),
    [checked, setChecked] = useState(false);
  const navigate = useNavigate(),
    path = `/admin/clients/${id}`,
    locked = delivery !== 'idle';
  useEffect(() => {
    let active = true;
    void apiRequest<Detail>(path, { auth: true })
      .then((value) => {
        if (active) {
          setDetail(value);
          setDraft(clientDraft(value));
        }
      })
      .catch(() => {
        if (active) setStatus('This client could not be loaded. Check the client list or reload.');
      });
    void apiRequest<EmailTemplate[]>('/admin/templates', { auth: true })
      .then((value) => {
        if (active) setTemplates(value);
      })
      .catch(() => {
        if (active)
          setStatus('Templates could not be loaded. You can still write an email manually.');
      });
    return () => {
      active = false;
    };
  }, [path]);
  async function refresh() {
    setDetail(await apiRequest<Detail>(path, { auth: true }));
  }
  async function save() {
    if (!draft || busy) return;
    const parsed = clientInputSchema.safeParse(draft);
    if (!parsed.success) {
      setStatus(
        parsed.error.issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`).join(' '),
      );
      return;
    }
    setBusy(true);
    try {
      await apiRequest(path, { method: 'PUT', body: parsed.data, auth: true });
      await refresh();
      setStatus('Client saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }
  async function toggle(itemId: string, completed: boolean) {
    if (busy) return;
    const previous = detail?.checklist;
    setDetail((value) =>
      value
        ? {
            ...value,
            checklist: value.checklist.map((item) =>
              item.itemId === itemId
                ? { ...item, completedAt: completed ? new Date().toISOString() : null }
                : item,
            ),
          }
        : value,
    );
    setBusy(true);
    try {
      await apiRequest(`${path}/checklist/${itemId}`, {
        method: 'PUT',
        body: { completed },
        auth: true,
      });
      await refresh();
      setStatus('Checklist progress saved.');
    } catch (error) {
      if (previous) setDetail((value) => (value ? { ...value, checklist: previous } : value));
      setStatus(error instanceof Error ? error.message : 'The checklist could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    if (busy) return;
    setBusy(true);
    try {
      await apiRequest(path, { method: 'DELETE', auth: true });
      navigate('/admin/clients');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Deletion could not be completed. Check the client record before retrying.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function send(questionnaire = false) {
    if (busy || locked || !detail) return;
    let input;
    if (!questionnaire) {
      const parsed = sendEmailSchema(window.location.origin).safeParse({
        subject,
        body,
        ...(templateId ? { templateId } : {}),
      });
      if (!parsed.success) {
        setEmailStatus(parsed.error.issues.map((issue) => issue.message).join(' '));
        return;
      }
      input = parsed.data;
    }
    setBusy(true);
    setEmailStatus('');
    try {
      await apiRequest(`${path}/${questionnaire ? 'questionnaires' : 'emails'}`, {
        method: 'POST',
        auth: true,
        ...(input ? { body: input } : {}),
        signal: AbortSignal.timeout(10000),
      });
      setDelivery('sent');
      setEmailStatus('Gmail accepted the email and its history was saved.');
      void refresh().catch(() =>
        setStatus('The email was accepted and saved. Reload to refresh client activity.'),
      );
    } catch (error) {
      if (
        error instanceof APIError &&
        ([400, 404, 429].includes(error.status) ||
          (error.code === 'email_not_sent' && error.retryable === true))
      ) {
        setDelivery('idle');
        setEmailStatus(error.message);
      } else {
        setDelivery(
          error instanceof APIError && error.code === 'email_history_failed'
            ? 'history'
            : 'uncertain',
        );
        setEmailStatus(
          error instanceof APIError
            ? error.message
            : 'The email may have been sent. Check the mailbox and client history before sending again.',
        );
      }
    } finally {
      setBusy(false);
    }
  }
  function preview(value: string) {
    try {
      return detail ? expandTemplate(value, detail) : value;
    } catch {
      return 'Check the placeholders before sending.';
    }
  }
  function newEmail() {
    setDelivery('idle');
    setEmailStatus('');
    setChecked(false);
    setSubject('');
    setBody('');
    setTemplateId('');
  }
  if (!detail || !draft)
    return (
      <>
        <h1>Client details</h1>
        {status ? <p role="alert">{status}</p> : <p>Loading client…</p>}
        <Link to="/admin/clients">Back to clients</Link>
      </>
    );
  return (
    <>
      <Link to="/admin/clients">Back to clients</Link>
      <h1>
        {detail.firstName} {detail.lastName}
      </h1>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      <section>
        <h2>Client details</h2>
        <fieldset disabled={busy}>
          <legend>Manually entered details</legend>
          <ClientFields draft={draft} onChange={setDraft} />
          <button onClick={() => void save()}>Save client</button>
        </fieldset>
      </section>
      <section aria-label="Client checklist">
        <h2>Session checklist</h2>
        {detail.checklist.length === 0 && (
          <p>No checklist items yet. Add items to the master checklist.</p>
        )}
        {detail.checklist.map((item) => (
          <p key={item.itemId}>
            <label>
              <input
                type="checkbox"
                checked={item.completedAt !== null}
                disabled={busy}
                onChange={(event) => void toggle(item.itemId, event.target.checked)}
              />
              {item.label}
            </label>
          </p>
        ))}
      </section>
      <section aria-label="Client email">
        <h2>Write an email</h2>
        <p>
          Available placeholders: {PLACEHOLDERS.map((value) => `{{${value}}}`).join(', ')}.
          Questionnaire links are created when you send.
        </p>
        {emailStatus && (
          <p role="status" className="status-panel">
            {emailStatus}
          </p>
        )}
        <fieldset disabled={busy || locked}>
          <legend>Email draft</legend>
          <div className="field">
            <label htmlFor="email-template">Email template</label>
            <select
              id="email-template"
              value={templateId}
              onChange={(event) => {
                setTemplateId(event.target.value);
                const chosen = templates.find((item) => item.id === event.target.value);
                if (chosen) {
                  setSubject(preview(chosen.subject));
                  setBody(preview(chosen.body));
                }
              }}
            >
              <option value="">Write a new message</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="email-subject">Email subject</label>
            <input
              id="email-subject"
              value={subject}
              maxLength={200}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email-body">Email message</label>
            <textarea
              id="email-body"
              rows={7}
              maxLength={10000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <details>
            <summary>Preview email</summary>
            <p>{preview(subject)}</p>
            <pre className="message-text">{preview(body)}</pre>
          </details>
          <div className="stack">
            <button onClick={() => void send()}>Send email</button>
            <button className="secondary" onClick={() => void send(true)}>
              Send questionnaire invitation
            </button>
          </div>
        </fieldset>
        {delivery === 'sent' && (
          <button className="secondary" onClick={newEmail}>
            Write another email
          </button>
        )}
        {(delivery === 'uncertain' || delivery === 'history') && (
          <div>
            <p>
              {delivery === 'history'
                ? 'Do not resend to repair the missing history. Reconcile the accepted message with your mailbox.'
                : 'Check the mailbox and this client’s history before preparing another send.'}
            </p>
            <label>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
              I checked the mailbox and history and need a separate new email
            </label>
            <button className="secondary" disabled={!checked} onClick={newEmail}>
              Prepare a separate email
            </button>
          </div>
        )}
      </section>
      <section aria-label="Email history">
        <h2>Email history</h2>
        {detail.emails.length === 0 && <p>No recorded emails.</p>}
        {detail.emails.map((email) => (
          <article key={email.id}>
            <h3>{email.subject}</h3>
            <p>Sent {new Date(email.sentAt).toLocaleString()}</p>
            <pre className="message-text">{email.body}</pre>
            {email.questionnaireInviteId && (
              <a href={`#invitation-${email.questionnaireInviteId}`}>
                View associated questionnaire
              </a>
            )}
          </article>
        ))}
      </section>
      <section aria-label="Questionnaire history">
        <h2>Questionnaires and responses</h2>
        {detail.questionnaires.length === 0 && <p>No questionnaire invitations.</p>}
        {detail.questionnaires.map((invite) => (
          <article id={`invitation-${invite.id}`} key={invite.id} tabIndex={-1}>
            <h3>Questionnaire · {invite.status}</h3>
            <p>
              Sent {new Date(invite.sentAt).toLocaleString()} · expires{' '}
              {new Date(invite.expiresAt).toLocaleString()}
            </p>
            <dl>
              {[...invite.questionsSnapshot]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((question) => (
                  <div key={question.id}>
                    <dt>{question.prompt}</dt>
                    <dd>{invite.answers?.[question.id] || 'No answer recorded.'}</dd>
                    {question.options && <dd>Original choices: {question.options.join(', ')}</dd>}
                  </div>
                ))}
            </dl>
          </article>
        ))}
      </section>
      <section>
        <h2>Delete client</h2>
        <button className="secondary" disabled={busy} onClick={() => setRemove(true)}>
          Delete client and all history
        </button>
        {remove && (
          <div role="group" aria-label="Confirm client deletion">
            <p>
              Delete this client, email history, checklist progress, and questionnaires? This
              removes the record from this workspace.
            </p>
            <button disabled={busy} onClick={() => void destroy()}>
              Confirm client deletion
            </button>
            <button className="secondary" onClick={() => setRemove(false)}>
              Keep client
            </button>
          </div>
        )}
      </section>
    </>
  );
}
export default function ClientDetails() {
  const { id = '' } = useParams();
  return (
    <AdminLayout>
      <ClientDetailEditor key={id} id={id} />
    </AdminLayout>
  );
}
