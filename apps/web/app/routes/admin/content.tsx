import { useEffect, useState } from 'react';
import { ulid } from 'ulid';
import { type PublicBootstrap, pageEditSchema, faqEditSchema } from '@radiant/shared';
import { apiRequest } from '../../lib/api';
import { AdminLayout } from '../../components/AdminLayout';
type Page = PublicBootstrap['pages'][number];
type FAQ = PublicBootstrap['faq'];
export function ContentEditor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [faq, setFAQ] = useState<FAQ>([]);
  const [selected, setSelected] = useState('about');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    void apiRequest<PublicBootstrap>('/public/bootstrap')
      .then((data) => {
        if (active) {
          setPages(data.pages);
          setFAQ(data.faq);
          setLoaded(true);
        }
      })
      .catch(() => setStatus('Content could not be loaded. Reload to try again.'));
    return () => {
      active = false;
    };
  }, []);
  const current = pages.find((page) => page.page === selected);
  function edit(change: Partial<Page>) {
    setPages((previous) =>
      previous.map((page) => (page.page === selected ? { ...page, ...change } : page)),
    );
  }
  async function save(kind: 'page' | 'faq') {
    if (busy) return;
    setStatus('');
    const result =
      kind === 'page' ? pageEditSchema.safeParse(current) : faqEditSchema.safeParse(faq);
    if (!result.success) {
      setStatus(result.error.issues.map((issue) => issue.message).join(' '));
      return;
    }
    setBusy(true);
    try {
      await apiRequest(kind === 'page' ? `/admin/pages/${selected}` : '/admin/faq', {
        method: 'PUT',
        auth: true,
        body: result.data,
      });
      setStatus('Saved. Public pages refresh within 60 seconds.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Pages and FAQ</h1>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      {!loaded ? (
        <p>Loading content…</p>
      ) : (
        <>
          <section>
            <h2>Page copy</h2>
            <label htmlFor="page-choice">Page</label>
            <select
              id="page-choice"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              {['about', 'maternity', 'newborn', 'family'].map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            {current && (
              <>
                <div className="field">
                  <label htmlFor="intro">Introduction</label>
                  <textarea
                    id="intro"
                    value={current.introMd}
                    maxLength={4000}
                    onChange={(event) => edit({ introMd: event.target.value })}
                  />
                  <p className="field-help">
                    Plain text or Markdown. HTML and executable links are not allowed.
                  </p>
                </div>
                <h3>How It Works</h3>
                {current.howItWorks.map((step, index) => (
                  <fieldset key={index}>
                    <legend>Step {index + 1}</legend>
                    <label htmlFor={`step-title-${index}`}>Title</label>
                    <input
                      id={`step-title-${index}`}
                      value={step.title}
                      maxLength={80}
                      onChange={(event) =>
                        edit({
                          howItWorks: current.howItWorks.map((s, i) =>
                            i === index ? { ...s, title: event.target.value } : s,
                          ),
                        })
                      }
                    />
                    <label htmlFor={`step-body-${index}`}>Description</label>
                    <textarea
                      id={`step-body-${index}`}
                      value={step.body}
                      maxLength={600}
                      onChange={(event) =>
                        edit({
                          howItWorks: current.howItWorks.map((s, i) =>
                            i === index ? { ...s, body: event.target.value } : s,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        edit({ howItWorks: current.howItWorks.filter((_, i) => i !== index) })
                      }
                    >
                      Remove step {index + 1}
                    </button>
                  </fieldset>
                ))}
                <div className="stack">
                  <button
                    className="secondary"
                    disabled={current.howItWorks.length >= 8 || busy}
                    onClick={() =>
                      edit({ howItWorks: [...current.howItWorks, { title: '', body: '' }] })
                    }
                  >
                    Add step
                  </button>
                  <button disabled={busy} onClick={() => void save('page')}>
                    Save page
                  </button>
                </div>
              </>
            )}
          </section>
          <section>
            <h2>Frequently asked questions</h2>
            <p>Keep coverage of what to expect, what to wear, payment, and deposits.</p>
            {faq.map((entry, index) => (
              <fieldset key={entry.id}>
                <legend>Question {index + 1}</legend>
                <label htmlFor={`question-${entry.id}`}>Question</label>
                <input
                  id={`question-${entry.id}`}
                  value={entry.question}
                  maxLength={200}
                  onChange={(event) =>
                    setFAQ((old) =>
                      old.map((e) =>
                        e.id === entry.id ? { ...e, question: event.target.value } : e,
                      ),
                    )
                  }
                />
                <label htmlFor={`answer-${entry.id}`}>Answer</label>
                <textarea
                  id={`answer-${entry.id}`}
                  value={entry.answer}
                  maxLength={2000}
                  onChange={(event) =>
                    setFAQ((old) =>
                      old.map((e) =>
                        e.id === entry.id ? { ...e, answer: event.target.value } : e,
                      ),
                    )
                  }
                />
                <div className="stack">
                  <button
                    className="secondary"
                    disabled={index === 0 || busy}
                    onClick={() =>
                      setFAQ((old) => {
                        const next = [...old];
                        [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                        return next;
                      })
                    }
                  >
                    Move question {index + 1} up
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => setFAQ((old) => old.filter((e) => e.id !== entry.id))}
                  >
                    Remove question {index + 1}
                  </button>
                </div>
              </fieldset>
            ))}
            <div className="stack">
              <button
                className="secondary"
                disabled={busy || faq.length >= 40}
                onClick={() =>
                  setFAQ((old) => [
                    ...old,
                    { id: ulid(), question: '', answer: '', sortOrder: old.length },
                  ])
                }
              >
                Add question
              </button>
              <button disabled={busy} onClick={() => void save('faq')}>
                Save FAQ
              </button>
            </div>
          </section>
        </>
      )}
    </>
  );
}
export default function Content() {
  return (
    <AdminLayout>
      <ContentEditor />
    </AdminLayout>
  );
}
