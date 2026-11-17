import { Link } from 'react-router';
import { BookNow } from '../../components/BookNow';
import { HomeIntro } from '../../components/HomeIntro';
import { Gallery } from '../../components/Gallery';
import { usePublicContent } from '../../lib/publicContent';
export default function Home() {
  const { data } = usePublicContent();
  return (
    <>
      <HomeIntro>
        <BookNow />
        <span className="hero-note">Let’s make something you’ll come back to.</span>
      </HomeIntro>
      <section aria-labelledby="collections-heading">
        <div className="section-heading">
          <p className="eyebrow">Your next chapter</p>
          <h2 id="collections-heading">Explore the collections</h2>
        </div>
        <div className="collection-links">
          {(['maternity', 'newborn', 'family'] as const).map((type) => (
            <Link to={`/${type}`} key={type}>
              <h3>{type[0]!.toUpperCase() + type.slice(1)}</h3>
              <span>Explore the session →</span>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="portfolio-heading">
        <div className="section-heading">
          <p className="eyebrow">A collection of moments</p>
          <h2 id="portfolio-heading">The portfolio</h2>
        </div>
        <Gallery images={data?.gallery ?? []} loading={!data} />
      </section>
      <section className="closing-note">
        <h2>Let’s tell your story.</h2>
        <p>Share a little about the session you have in mind.</p>
        <BookNow />
      </section>
    </>
  );
}
