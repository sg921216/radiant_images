import { useEffect, useState } from 'react';
import { siteConfigSchema, type SiteConfig } from '@radiant/shared';
import { apiRequest } from '../../lib/api';
import { AdminLayout } from '../../components/AdminLayout';
type Draft = Omit<SiteConfig, 'shootLocations' | 'referralSources'> & {
  shootLocations: string;
  referralSources: string;
};
const toDraft = (config: SiteConfig): Draft => ({
  ...config,
  shootLocations: config.shootLocations.join('\n'),
  referralSources: config.referralSources.join('\n'),
});
export function SettingsEditor() {
  const [draft, setDraft] = useState<Draft | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [fields, setFields] = useState<Record<string, string>>({});
  useEffect(() => {
    void apiRequest<SiteConfig>('/admin/config', { auth: true })
      .then((config) => setDraft(toDraft(config)))
      .catch(() => setStatus('Settings could not be loaded. Reload to try again.'));
  }, []);
  async function save() {
    if (!draft || busy) return;
    const result = siteConfigSchema.safeParse({
      ...draft,
      shootLocations: draft.shootLocations
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      referralSources: draft.referralSources
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    });
    if (!result.success) {
      setFields(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      setStatus('Check the settings below. Nothing has been changed.');
      return;
    }
    setFields({});
    setBusy(true);
    try {
      await apiRequest('/admin/config', { method: 'PUT', body: result.data, auth: true });
      setDraft(toDraft(result.data));
      setStatus('Settings saved. Public contact details and options refresh within 60 seconds.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed. Your edits are still here.');
    } finally {
      setBusy(false);
    }
  }
  const labels = {
    inquiryRecipient: 'Private inquiry recipient',
    senderAddress: 'Gmail sender address',
    publicContactEmail: 'Public contact email (displayed on the website)',
    timezone: 'Timezone (IANA name)',
    shootLocations: 'Shoot locations (one per line, in display order)',
    referralSources: 'Referral sources (one per line, in display order)',
  };
  return (
    <>
      <h1>Settings</h1>
      <p>
        The public contact email is shown to visitors for manual inquiry recovery. Use an address
        you approve for publication and monitor regularly.
      </p>
      <p>
        The sender must be the connected Gmail identity or an accepted send-as alias. Every save
        verifies it before changing any settings.
      </p>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      {draft ? (
        <fieldset disabled={busy}>
          <legend>Contact and session settings</legend>
          {(Object.keys(labels) as (keyof Draft)[]).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`setting-${key}`}>{labels[key]}</label>
              {key === 'shootLocations' || key === 'referralSources' ? (
                <textarea
                  id={`setting-${key}`}
                  value={draft[key]}
                  aria-invalid={Boolean(fields[key])}
                  aria-describedby={fields[key] ? `error-${key}` : undefined}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                />
              ) : (
                <input
                  id={`setting-${key}`}
                  type={key === 'timezone' ? 'text' : 'email'}
                  value={draft[key]}
                  aria-invalid={Boolean(fields[key])}
                  aria-describedby={fields[key] ? `error-${key}` : undefined}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                />
              )}{' '}
              {fields[key] && <p id={`error-${key}`}>{fields[key]}</p>}
            </div>
          ))}
          <button onClick={() => void save()}>Save settings</button>
        </fieldset>
      ) : (
        <p>Loading settings…</p>
      )}
    </>
  );
}
export default function Settings() {
  return (
    <AdminLayout>
      <SettingsEditor />
    </AdminLayout>
  );
}
