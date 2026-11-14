import { useEffect, useState } from 'react';
import {
  bannerInputSchema,
  localScheduleToIso,
  scheduleLocalValue,
  type PublicBootstrap,
} from '@radiant/shared';
import { apiRequest } from '../../lib/api';
import { AdminLayout } from '../../components/AdminLayout';
type Banner = NonNullable<PublicBootstrap['banner']>;
const blank = { message: '', linkUrl: '', startsAt: '', endsAt: '' };
export function BannerEditor() {
  const [banners, setBanners] = useState<Banner[]>([]),
    [timezone, setTimezone] = useState(''),
    [draft, setDraft] = useState(blank),
    [id, setId] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [remove, setRemove] = useState<string | null>(null);
  async function refresh() {
    setBanners(await apiRequest<Banner[]>('/admin/banners', { auth: true }));
  }
  useEffect(() => {
    void Promise.all([
      apiRequest<Banner[]>('/admin/banners', { auth: true }).then(setBanners),
      apiRequest<PublicBootstrap>('/public/bootstrap').then((value) =>
        setTimezone(value.config.timezone),
      ),
    ]).catch(() => setStatus('Banners could not be loaded. Reload to try again.'));
  }, []);
  function edit(banner: Banner) {
    setId(banner.id);
    setDraft({
      message: banner.message,
      linkUrl: banner.linkUrl ?? '',
      startsAt: scheduleLocalValue(banner.startsAt, timezone),
      endsAt: scheduleLocalValue(banner.endsAt, timezone),
    });
    setStatus('Editing selected banner.');
  }
  async function save() {
    if (busy) return;
    let input;
    try {
      input = bannerInputSchema.parse({
        ...draft,
        linkUrl: draft.linkUrl.trim() || null,
        startsAt: localScheduleToIso(draft.startsAt, timezone),
        endsAt: localScheduleToIso(draft.endsAt, timezone),
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Check the banner fields.');
      return;
    }
    setBusy(true);
    setStatus('Saving banner…');
    try {
      await apiRequest(id ? `/admin/banners/${id}` : '/admin/banners', {
        method: id ? 'PUT' : 'POST',
        body: input,
        auth: true,
      });
      await refresh();
      setId(null);
      setDraft(blank);
      setStatus('Banner saved. Public pages refresh within 60 seconds.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    if (!remove || busy) return;
    setBusy(true);
    setStatus('Deleting banner…');
    try {
      await apiRequest(`/admin/banners/${remove}`, { method: 'DELETE', auth: true });
      await refresh();
      if (id === remove) {
        setId(null);
        setDraft(blank);
      }
      setRemove(null);
      setStatus('Banner deleted.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Deletion failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Banners</h1>
      <p>Schedule timezone: {timezone || 'Loading…'}</p>
      <p>
        Start times are inclusive; end times are exclusive. When schedules overlap, the latest start
        wins, then the newest creation. Choose a time outside a repeated daylight-saving hour.
      </p>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      <fieldset disabled={busy || !timezone}>
        <legend>{id ? 'Edit banner' : 'New banner'}</legend>
        <div className="field">
          <label htmlFor="banner-message">Message</label>
          <textarea
            id="banner-message"
            value={draft.message}
            maxLength={200}
            onChange={(event) => setDraft({ ...draft, message: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="banner-link">Link (HTTPS, optional)</label>
          <input
            id="banner-link"
            type="url"
            value={draft.linkUrl}
            onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })}
          />
        </div>
        <div className="form-grid">
          {(['startsAt', 'endsAt'] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`banner-${key}`}>
                {key === 'startsAt' ? 'Starts' : 'Ends'} ({timezone})
              </label>
              <input
                id={`banner-${key}`}
                type="datetime-local"
                value={draft[key]}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="stack">
          <button onClick={() => void save()}>Save banner</button>
          {id && (
            <button
              className="secondary"
              onClick={() => {
                setId(null);
                setDraft(blank);
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </fieldset>
      <section>
        <h2>Scheduled banners</h2>
        {banners.length === 0 && <p>No banners scheduled.</p>}
        <ul>
          {(timezone ? banners : []).map((banner) => (
            <li key={banner.id}>
              <p>{banner.message}</p>
              <p>
                {scheduleLocalValue(banner.startsAt, timezone)} –{' '}
                {scheduleLocalValue(banner.endsAt, timezone)} ({timezone})
              </p>
              <div className="stack">
                <button disabled={busy} onClick={() => edit(banner)}>
                  Edit {banner.message}
                </button>
                <button className="secondary" disabled={busy} onClick={() => setRemove(banner.id)}>
                  Delete {banner.message}
                </button>
              </div>
              {remove === banner.id && (
                <div role="group" aria-label="Confirm banner deletion">
                  <p>Delete this scheduled banner?</p>
                  <button disabled={busy} onClick={() => void destroy()}>
                    Confirm deletion
                  </button>
                  <button className="secondary" onClick={() => setRemove(null)}>
                    Keep banner
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
export default function Banners() {
  return (
    <AdminLayout>
      <BannerEditor />
    </AdminLayout>
  );
}
