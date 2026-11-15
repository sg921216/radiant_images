import type { ShootType } from '@radiant/shared';
import { usePublicContent } from '../lib/publicContent';
import { Gallery } from './Gallery';
import { BookNow } from './BookNow';
import { SafeMarkdown } from './SafeMarkdown';
import { PricingSection } from './PricingSection';
const descriptions = {
  maternity:
    'A moment of anticipation. Photographs to remember this chapter before your family grows.',
  newborn: 'Small details, a new beginning. Photographs of the earliest days together.',
  family:
    'Your family, as you are. A collection of the connections and everyday moments that matter.',
};
export function ServicePage({ type }: { type: ShootType }) {
  const { data, error } = usePublicContent();
  const page = data?.pages.find((p) => p.page === type);
  const title = type[0]!.toUpperCase() + type.slice(1);
  return (
    <>
      <section className="service-intro">
        <p className="eyebrow">The {type} collection</p>
        <h1>{title} photography</h1>
        <SafeMarkdown>{page?.introMd || descriptions[type]}</SafeMarkdown>
        <BookNow />
      </section>
      <section aria-label={`${title} portfolio`}>
        <Gallery images={data?.gallery ?? []} tag={type} loading={!data} />
      </section>
      <section className="how-it-works">
        <p className="eyebrow">A little preparation, lasting memories</p>
        <h2>How It Works</h2>
        {page?.howItWorks.length ? (
          <ol className="steps">
            {page.howItWorks.map((step, index) => (
              <li key={index}>
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p>Start with an inquiry. Rebekah will help you discuss the details of your session.</p>
        )}
      </section>
      {data ? (
        <PricingSection revision={data.pricing} type={type} />
      ) : (
        <section id="pricing">
          <h2>Pricing</h2>
          <p role="status">Loading the current pricing schedule…</p>
          <BookNow />
        </section>
      )}
      {error && (
        <p role="status" className="muted">
          {error}
        </p>
      )}
    </>
  );
}
