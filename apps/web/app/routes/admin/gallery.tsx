import { useEffect, useRef, useState } from 'react';
import { GALLERY_TAGS, altTextSchema, type GalleryImage } from '@radiant/shared';
import { apiRequest } from '../../lib/api';
import { prepareImage } from '../../lib/images';
import { AdminLayout } from '../../components/AdminLayout';
export function GalleryEditor() {
  const [images, setImages] = useState<GalleryImage[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState('');
  const [file, setFile] = useState<File | null>(null),
    [alt, setAlt] = useState(''),
    [tag, setTag] = useState('general'),
    [remove, setRemove] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function refresh() {
    const data = await apiRequest<GalleryImage[]>('/admin/gallery', { auth: true });
    setImages(data);
    setLoaded(true);
  }
  useEffect(() => {
    void apiRequest<GalleryImage[]>('/admin/gallery', { auth: true })
      .then((data) => {
        setImages(data);
        setLoaded(true);
      })
      .catch(() => setStatus('The gallery could not be loaded. Reload to try again.'));
  }, []);
  async function change(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setStatus('Saving…');
    try {
      await action();
      await refresh();
      setStatus(success);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'The change failed. Your draft is still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload() {
    if (busy) return;
    const parsed = altTextSchema.safeParse(alt);
    if (!file || !parsed.success) {
      setStatus('Choose a photo and enter a meaningful description of 1–200 characters.');
      return;
    }
    setBusy(true);
    setStatus('Preparing your photo…');
    try {
      const form = await prepareImage(file);
      form.set('tag', tag);
      form.set('altText', parsed.data);
      setStatus('Validating and uploading your photo…');
      await apiRequest('/admin/gallery', { method: 'POST', body: form, auth: true });
      setFile(null);
      setAlt('');
      if (input.current) input.current.value = '';
      await refresh();
      setStatus('Photo published. Public galleries refresh within 60 seconds.');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Upload failed. Your photo and description are still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  function edit(id: string, value: Partial<GalleryImage>) {
    setImages((old) => old.map((item) => (item.id === id ? { ...item, ...value } : item)));
  }
  async function move(index: number, offset: number) {
    const ids = images.map((i) => i.id);
    [ids[index], ids[index + offset]] = [ids[index + offset]!, ids[index]!];
    await change(
      () => apiRequest('/admin/gallery/order', { method: 'PUT', body: { ids }, auth: true }),
      'Gallery order saved.',
    );
  }
  return (
    <>
      <h1>Gallery</h1>
      <p>{images.length} of 60 images</p>
      <p>
        Choose still JPEG, PNG, or WebP photos up to 10 MiB and 40 megapixels. Describe the visible
        subject and setting for visitors who cannot see the photo.
      </p>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      <fieldset disabled={busy || !loaded || images.length >= 60}>
        <legend>Upload a photo</legend>
        <div className="field">
          <label htmlFor="gallery-file">Photo</label>
          <input
            ref={input}
            id="gallery-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <div className="field">
          <label htmlFor="gallery-alt">Photo description (alt text)</label>
          <textarea
            id="gallery-alt"
            maxLength={200}
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="gallery-tag">Gallery category</label>
          <select id="gallery-tag" value={tag} onChange={(event) => setTag(event.target.value)}>
            {GALLERY_TAGS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => void upload()}>Upload photo</button>
      </fieldset>
      <ol className="gallery-editor">
        {images.map((item, index) => (
          <li key={item.id}>
            <fieldset disabled={busy}>
              <legend>Photo {index + 1}</legend>
              <img
                src={item.urls.thumb}
                alt={item.altText}
                width={160}
                height={Math.round((160 * item.height) / item.width)}
                loading="lazy"
              />
              <div className="field">
                <label htmlFor={`${item.id}-alt`}>Description for photo {index + 1}</label>
                <textarea
                  id={`${item.id}-alt`}
                  maxLength={200}
                  value={item.altText}
                  onChange={(event) => edit(item.id, { altText: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor={`${item.id}-tag`}>Category for photo {index + 1}</label>
                <select
                  id={`${item.id}-tag`}
                  value={item.tag}
                  onChange={(event) =>
                    edit(item.id, { tag: event.target.value as GalleryImage['tag'] })
                  }
                >
                  {GALLERY_TAGS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="stack">
                <button
                  onClick={() => {
                    if (!altTextSchema.safeParse(item.altText).success) {
                      setStatus('Each photo needs a meaningful description of 1–200 characters.');
                      return;
                    }
                    void change(
                      () =>
                        apiRequest(`/admin/gallery/${item.id}`, {
                          method: 'PATCH',
                          body: { tag: item.tag, altText: item.altText },
                          auth: true,
                        }),
                      'Photo details saved.',
                    );
                  }}
                >
                  Save photo {index + 1}
                </button>
                <button
                  className="secondary"
                  disabled={index === 0}
                  onClick={() => void move(index, -1)}
                >
                  Move photo {index + 1} up
                </button>
                <button
                  className="secondary"
                  disabled={index === images.length - 1}
                  onClick={() => void move(index, 1)}
                >
                  Move photo {index + 1} down
                </button>
                <button className="secondary" onClick={() => setRemove(item.id)}>
                  Remove photo {index + 1}
                </button>
              </div>
              {remove === item.id && (
                <div role="group" aria-label="Confirm photo removal">
                  <p>Remove this photo from every public gallery?</p>
                  <button
                    onClick={() =>
                      void change(async () => {
                        await apiRequest(`/admin/gallery/${item.id}`, {
                          method: 'DELETE',
                          auth: true,
                        });
                        setRemove(null);
                      }, 'Photo removed.')
                    }
                  >
                    Confirm removal
                  </button>
                  <button className="secondary" onClick={() => setRemove(null)}>
                    Keep photo
                  </button>
                </div>
              )}
            </fieldset>
          </li>
        ))}
      </ol>
    </>
  );
}
export default function Gallery() {
  return (
    <AdminLayout>
      <GalleryEditor />
    </AdminLayout>
  );
}
