import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { answersSchema, questionsSchema, type Question } from '@radiant/shared';
import { apiRequest, APIError } from '../../lib/api';
type PublicQuestionnaire = {
  clientFirstName: string;
  status: 'pending' | 'submitted' | 'expired';
  questions: Question[];
};
export function QuestionnaireForm({ token }: { token: string }) {
  const [data, setData] = useState<PublicQuestionnaire | null>(null),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [missing, setMissing] = useState(false),
    [message, setMessage] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({});
  const summary = useRef<HTMLDivElement>(null);
  const path = `/questionnaire/${encodeURIComponent(token)}`;
  useEffect(() => {
    let active = true;
    void apiRequest<PublicQuestionnaire>(path)
      .then((value) => {
        if (active) setData({ ...value, questions: questionsSchema.parse(value.questions) });
      })
      .catch((error) => {
        if (active) {
          setMissing(error instanceof APIError && [400, 404].includes(error.status));
          setMessage('This questionnaire could not be loaded. Check the link or try again.');
        }
      });
    return () => {
      active = false;
    };
  }, [path]);
  useEffect(() => {
    if (message) summary.current?.focus();
  }, [message, errors]);
  async function check() {
    if (busy) return;
    setBusy(true);
    try {
      const value = await apiRequest<PublicQuestionnaire>(path);
      setData({ ...value, questions: questionsSchema.parse(value.questions) });
      setUncertain(false);
      setMessage(
        value.status === 'pending'
          ? 'No submission is recorded. Review your answers and submit when ready.'
          : '',
      );
    } catch (error) {
      setMissing(error instanceof APIError && [400, 404].includes(error.status));
      setMessage('The submission status could not be checked. Try again before submitting.');
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!data || busy || uncertain || data.status !== 'pending') return;
    const parsed = answersSchema(data.questions).safeParse(answers);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      setMessage('Please answer the highlighted questions.');
      return;
    }
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      await apiRequest(path, {
        method: 'POST',
        body: { answers: parsed.data },
        signal: AbortSignal.timeout(10000),
      });
      setData({ ...data, status: 'submitted' });
    } catch (error) {
      if (error instanceof APIError && [400, 429].includes(error.status)) {
        setMessage(error.message);
        setErrors(
          Object.fromEntries(
            Object.entries(error.fields ?? {}).map(([key, value]) => [
              key.replace(/^answers\./, ''),
              value,
            ]),
          ),
        );
      } else {
        setUncertain(true);
        setMessage(
          'Your answers may have been recorded. Check the submission status before trying again.',
        );
      }
    } finally {
      setBusy(false);
    }
  }
  if (data?.status === 'submitted')
    return (
      <>
        <h1>Your session questionnaire</h1>
        <p role="status">Thank you. Your questionnaire has been submitted.</p>
      </>
    );
  if (data?.status === 'expired')
    return (
      <>
        <h1>Your session questionnaire</h1>
        <p role="status">This questionnaire has expired. Ask Rebekah for a new invitation.</p>
      </>
    );
  return (
    <>
      <h1>Your session questionnaire</h1>
      {message && (
        <div ref={summary} role="alert" tabIndex={-1} className="status-panel">
          <p>{message}</p>
          {Object.entries(errors).length > 0 && (
            <ul>
              {Object.entries(errors).map(([id, text]) => (
                <li key={id}>
                  <a href={`#answer-${id}`}>{text}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {missing ? (
        <p>This invitation is not available. Ask Rebekah to check your link.</p>
      ) : data ? (
        <>
          <p>
            Hello {data.clientFirstName}. Tell us about your session. Required questions are marked
            below.
          </p>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset disabled={busy || uncertain}>
              {[...data.questions]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((question) => {
                  const props = {
                    id: `answer-${question.id}`,
                    value: answers[question.id] ?? '',
                    required: question.required,
                    'aria-invalid': Boolean(errors[question.id]),
                    'aria-describedby': `help-${question.id}`,
                    ...(errors[question.id] ? { 'aria-errormessage': `error-${question.id}` } : {}),
                    onChange: (
                      event: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                      >,
                    ) =>
                      setAnswers((previous) => ({
                        ...previous,
                        [question.id]: event.target.value,
                      })),
                  };
                  return (
                    <div className="field" key={question.id}>
                      <label htmlFor={props.id}>{question.prompt}</label>
                      <p id={`help-${question.id}`}>
                        {question.required ? 'Required' : 'Optional'}
                        {question.kind === 'short_text'
                          ? ' · up to 300 characters'
                          : question.kind === 'long_text'
                            ? ' · up to 4000 characters'
                            : ''}
                      </p>
                      {question.kind === 'single_choice' ? (
                        <select {...props}>
                          <option value="">Choose an option</option>
                          {question.options!.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : question.kind === 'long_text' ? (
                        <textarea {...props} maxLength={4000} rows={6} />
                      ) : (
                        <input {...props} maxLength={300} />
                      )}{' '}
                      {errors[question.id] && (
                        <p id={`error-${question.id}`}>{errors[question.id]}</p>
                      )}
                    </div>
                  );
                })}
              <button type="submit">Submit questionnaire</button>
            </fieldset>
          </form>
        </>
      ) : (
        <p>Loading questionnaire…</p>
      )}
      {!missing && (uncertain || !data) && message && (
        <button disabled={busy} onClick={() => void check()}>
          Check submission status
        </button>
      )}
    </>
  );
}
export default function Questionnaire() {
  const { token = '' } = useParams();
  return (
    <main id="main">
      <QuestionnaireForm key={token} token={token} />
    </main>
  );
}
