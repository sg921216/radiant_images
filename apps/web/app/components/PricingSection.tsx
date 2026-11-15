import { SHOOT_TYPES, type PricingRevision, type ShootType } from '@radiant/shared';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { formatPrice, packagesFor, titleCase } from '../lib/pricing';
import { BookNow } from './BookNow';
import '../styles/print.css';
function Packages({ revision, type }: { revision: PricingRevision; type: ShootType }) {
  return (
    <div className="pricing-packages">
      {packagesFor(revision, type).map((pkg) => (
        <article key={pkg.id} className="price-card">
          <h3>{pkg.name}</h3>
          <p className="price">{formatPrice(pkg.priceCents)}</p>
          <p>{pkg.description}</p>
          <ul>
            {pkg.inclusions.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
export function PricingSection({ revision, type }: { revision: PricingRevision; type: ShootType }) {
  const [frozen, setFrozen] = useState<PricingRevision | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const current = frozen ?? revision;
  useEffect(() => {
    const before = () => flushSync(() => setFrozen(revision));
    const after = () => setFrozen(null);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [revision]);
  async function download() {
    if (working) return;
    const snapshot = current;
    setFrozen(snapshot);
    setWorking(true);
    setError('');
    try {
      const { createPricingPdf } = await import('../lib/PricingPdf');
      const blob = await createPricingPdf(snapshot);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `radiant-images-pricing-${snapshot.revisionId}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError('The PDF could not be created. You can still print the complete pricing schedule.');
    } finally {
      setWorking(false);
      setFrozen(null);
    }
  }
  return (
    <section id="pricing" className="pricing-shell">
      <div className="screen-pricing">
        <section aria-label={`${titleCase(type)} pricing`}>
          <p className="eyebrow">Your investment</p>
          <h2>Pricing</h2>
          <Packages revision={current} type={type} />
          <BookNow />
        </section>
        <div className="stack pricing-tools">
          <button className="secondary" disabled={working} onClick={() => window.print()}>
            Print all pricing
          </button>
          <button className="secondary" disabled={working} onClick={() => void download()}>
            {working ? 'Preparing PDF…' : error ? 'Try PDF again' : 'Download all pricing (PDF)'}
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p className="muted">
          All prices in USD. Published {current.publishedAt.slice(0, 10)} · Revision{' '}
          {current.revisionId}
        </p>
      </div>
      <div className="print-schedule" aria-hidden="true">
        {SHOOT_TYPES.map((shootType) => (
          <section className="print-page" key={shootType}>
            <p>Radiant Images · Photography by Rebekah</p>
            <h1>{titleCase(shootType)} pricing</h1>
            <Packages revision={current} type={shootType} />
            <p className="revision">
              Published {current.publishedAt.slice(0, 10)} · Revision {current.revisionId} · USD
            </p>
          </section>
        ))}
      </div>
    </section>
  );
}
