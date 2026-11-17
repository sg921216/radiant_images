import * as React from 'react';

export function HomeIntro({ children }: { children: React.ReactNode }) {
  return (
    <section className="home-intro">
      <div className="intro-copy">
        <p className="eyebrow">Maternity · Newborn · Family</p>
        <h1>
          The days are fleeting.
          <br />
          <em>Keep the feeling.</em>
        </h1>
        <p>Photography by Rebekah, celebrating the people and moments you hold close.</p>
        {children}
      </div>
      <img
        className="intro-still-life"
        src="/stationery-480.webp"
        srcSet="/stationery-480.webp 480w, /stationery-960.webp 960w"
        sizes="(max-width: 700px) 92vw, (max-width: 1440px) 45vw, 650px"
        width={960}
        height={960}
        alt=""
      />
    </section>
  );
}
