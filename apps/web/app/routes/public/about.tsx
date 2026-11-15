import { usePublicContent } from '../../lib/publicContent';
import { SafeMarkdown } from '../../components/SafeMarkdown';
import { BookNow } from '../../components/BookNow';
export default function About() {
  const { data } = usePublicContent();
  return (
    <section className="service-intro">
      <p className="eyebrow">Behind the camera</p>
      <h1>Meet Rebekah</h1>
      <SafeMarkdown>
        {data?.pages.find((p) => p.page === 'about')?.introMd ||
          'Welcome to Radiant Images. Explore maternity, newborn, and family photography, and get in touch to discuss your session.'}
      </SafeMarkdown>
      <BookNow />
    </section>
  );
}
