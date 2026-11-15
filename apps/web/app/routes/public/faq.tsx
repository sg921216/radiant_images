import { usePublicContent } from '../../lib/publicContent';
import { SafeMarkdown } from '../../components/SafeMarkdown';
export default function FAQ() {
  const { data, error } = usePublicContent();
  return (
    <>
      <section className="service-intro">
        <p className="eyebrow">Before your session</p>
        <h1>A few things to know</h1>
        <p>What to expect, what to wear, payment, and deposits.</p>
      </section>
      <section className="faq-list" aria-label="Frequently asked questions">
        {data?.faq.map((entry) => (
          <details key={entry.id}>
            <summary>{entry.question}</summary>
            <SafeMarkdown>{entry.answer}</SafeMarkdown>
          </details>
        ))}
        {!data && <p role="status">{error || 'Loading the latest answers…'}</p>}
      </section>
    </>
  );
}
