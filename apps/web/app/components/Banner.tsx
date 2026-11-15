import type { PublicBootstrap } from '@radiant/shared';
import { useEffect, useState } from 'react';
export function Banner({ banner }: { banner: PublicBootstrap['banner'] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const immediate = setTimeout(update, 0);
    const remaining = banner ? Date.parse(banner.endsAt) - Date.now() : 0;
    const timer = setTimeout(update, Math.max(0, Math.min(remaining, 2147483647)));
    const interval = setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      clearTimeout(timer);
      clearTimeout(immediate);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, [banner]);
  if (!banner || Date.parse(banner.startsAt) > now || Date.parse(banner.endsAt) <= now) return null;
  return (
    <section className="announcement" aria-label="Announcement">
      {banner.linkUrl ? (
        <a href={banner.linkUrl} rel="noopener noreferrer">
          {banner.message}
        </a>
      ) : (
        <p>{banner.message}</p>
      )}
    </section>
  );
}
