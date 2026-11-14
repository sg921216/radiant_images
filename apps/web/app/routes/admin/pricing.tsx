import { useEffect, useState } from 'react';
import { ulid } from 'ulid';
import {
  SHOOT_TYPES,
  pricingDraftSchema,
  type PricingRevision,
  type ShootType,
} from '@radiant/shared';
import { apiRequest } from '../../lib/api';
import { titleCase } from '../../lib/pricing';
import { AdminLayout } from '../../components/AdminLayout';
type DraftPackage = PricingRevision['packages'][number] & { price: string };
export function PricingEditor() {
  const [packages, setPackages] = useState<DraftPackage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let active = true;
    void apiRequest<PricingRevision>('/admin/pricing', { auth: true })
      .then((revision) => {
        if (active) {
          setPackages(
            revision.packages.map((p) => ({ ...p, price: (p.priceCents / 100).toFixed(2) })),
          );
          setLoaded(true);
        }
      })
      .catch(() => setStatus('Pricing could not be loaded. Reload to try again.'));
    return () => {
      active = false;
    };
  }, []);
  function edit(id: string, value: Partial<DraftPackage>) {
    setPackages((previous) => previous.map((p) => (p.id === id ? { ...p, ...value } : p)));
  }
  function move(type: ShootType, id: string, offset: number) {
    setPackages((previous) => {
      const group = previous.filter((p) => p.shootType === type);
      const index = group.findIndex((p) => p.id === id);
      const next = index + offset;
      if (next < 0 || next >= group.length) return previous;
      [group[index], group[next]] = [group[next]!, group[index]!];
      return [...previous.filter((p) => p.shootType !== type), ...group];
    });
  }
  async function publish() {
    if (busy) return;
    if (packages.some((p) => !/^\d+(\.\d{1,2})?$/.test(p.price))) {
      setStatus('Enter prices in USD with at most two decimal places.');
      return;
    }
    const payload = {
      packages: SHOOT_TYPES.flatMap((type) =>
        packages
          .filter((p) => p.shootType === type)
          .map(({ price, ...p }, index) => {
            const [whole, fraction = ''] = price.split('.');
            return {
              ...p,
              sortOrder: index,
              priceCents: Number(whole) * 100 + Number(fraction.padEnd(2, '0')),
            };
          }),
      ),
    };
    const parsed = pricingDraftSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus(parsed.error.issues.map((issue) => issue.message).join(' '));
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const revision = await apiRequest<PricingRevision>('/admin/pricing', {
        method: 'PUT',
        auth: true,
        body: parsed.data,
      });
      setPackages(revision.packages.map((p) => ({ ...p, price: (p.priceCents / 100).toFixed(2) })));
      setStatus('Pricing published. Public pages refresh within 60 seconds.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Publication failed. Your draft is still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Pricing</h1>
      <p>
        Publish a complete schedule for all three session types. Each save updates the website,
        print schedule, and PDF together.
      </p>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      {!loaded ? (
        <p>Loading current pricing…</p>
      ) : (
        <fieldset disabled={busy}>
          {SHOOT_TYPES.map((type) => {
            const group = packages.filter((p) => p.shootType === type);
            return (
              <section key={type}>
                <h2>{titleCase(type)}</h2>
                {group.map((pkg, index) => (
                  <fieldset key={pkg.id}>
                    <legend>Package {index + 1}</legend>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor={`${pkg.id}-name`}>
                          {titleCase(type)} package {index + 1} name
                        </label>
                        <input
                          id={`${pkg.id}-name`}
                          value={pkg.name}
                          maxLength={60}
                          onChange={(event) => edit(pkg.id, { name: event.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`${pkg.id}-price`}>Price (USD)</label>
                        <input
                          id={`${pkg.id}-price`}
                          inputMode="decimal"
                          value={pkg.price}
                          onChange={(event) => edit(pkg.id, { price: event.target.value })}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor={`${pkg.id}-description`}>Description</label>
                      <textarea
                        id={`${pkg.id}-description`}
                        value={pkg.description}
                        maxLength={500}
                        onChange={(event) => edit(pkg.id, { description: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`${pkg.id}-inclusions`}>Inclusions (one per line)</label>
                      <textarea
                        id={`${pkg.id}-inclusions`}
                        value={pkg.inclusions.join('\n')}
                        onChange={(event) =>
                          edit(pkg.id, { inclusions: event.target.value.split('\n') })
                        }
                      />
                    </div>
                    <div className="stack">
                      <button
                        className="secondary"
                        disabled={index === 0}
                        onClick={() => move(type, pkg.id, -1)}
                      >
                        Move {type} package {index + 1} up
                      </button>
                      <button
                        className="secondary"
                        disabled={index === group.length - 1}
                        onClick={() => move(type, pkg.id, 1)}
                      >
                        Move {type} package {index + 1} down
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setPackages((old) => old.filter((p) => p.id !== pkg.id))}
                      >
                        Remove {type} package {index + 1}
                      </button>
                    </div>
                  </fieldset>
                ))}
                <button
                  className="secondary"
                  onClick={() =>
                    setPackages((old) => [
                      ...old,
                      {
                        id: ulid(),
                        shootType: type,
                        sortOrder: group.length,
                        name: '',
                        description: '',
                        inclusions: [''],
                        priceCents: 0,
                        price: '',
                      },
                    ])
                  }
                >
                  Add {type} package
                </button>
              </section>
            );
          })}
          <button onClick={() => void publish()}>Publish pricing</button>
        </fieldset>
      )}
    </>
  );
}
export default function Pricing() {
  return (
    <AdminLayout>
      <PricingEditor />
    </AdminLayout>
  );
}
