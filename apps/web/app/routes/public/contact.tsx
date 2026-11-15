import { usePublicContent } from '../../lib/publicContent';
import { InquiryForm } from '../../components/forms/InquiryForm';
export default function Contact() {
  const { data, error, refresh } = usePublicContent();
  const email =
    data?.config.publicContactEmail ||
    import.meta.env.VITE_PUBLIC_CONTACT_EMAIL ||
    'hello@example.invalid';
  return (
    <>
      <section className="contact-intro">
        <p className="eyebrow">Let’s make a little room for memories</p>
        <h1>Tell me your story.</h1>
        <p>
          Share what you have in mind. An inquiry starts a conversation; your session is confirmed
          separately with Rebekah.
        </p>
        <p>
          Need to reach Rebekah directly or check whether an inquiry arrived?{' '}
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      </section>
      <div className="contact-form">
        {data ? (
          <InquiryForm config={data.config} refresh={refresh} />
        ) : (
          <div className="status-panel">
            <p role="status">{error || 'Loading the inquiry form…'}</p>
            {error && <button onClick={() => void refresh()}>Load the form again</button>}
          </div>
        )}
      </div>
    </>
  );
}
