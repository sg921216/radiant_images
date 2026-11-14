import type { PublicBootstrap } from '@radiant/shared';

// Kept self-contained so the build can serialize it into a CSP-hashed head script.
export function startPublicBootstrap(apiOrigin: string, path: string) {
  window.__radiantBootstrap = fetch(apiOrigin + '/public/bootstrap', {
    cache: 'no-store',
    credentials: 'omit',
    signal: AbortSignal.timeout(10000),
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = (await response.json()) as PublicBootstrap;
      const tag = path.replace(/^\//, '').replace(/\/$/, '');
      if (['maternity', 'newborn', 'family'].includes(tag)) {
        const image = data.gallery
          ?.filter((image) => image.tag === tag)
          .sort((a, b) => a.sortOrder - b.sortOrder)[0];
        if (
          image &&
          Object.values(image.urls).every((value) => value.startsWith(apiOrigin + '/images/'))
        ) {
          const edge = Math.max(image.width, image.height);
          const width = (cap: number) => Math.round(image.width * Math.min(1, cap / edge));
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = image.urls.card;
          link.setAttribute(
            'imagesrcset',
            `${image.urls.thumb} ${width(320)}w, ${image.urls.card} ${width(800)}w, ${image.urls.full} ${image.width}w`,
          );
          link.setAttribute(
            'imagesizes',
            '(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw',
          );
          link.setAttribute('fetchpriority', 'high');
          document.head.appendChild(link);
        }
      }
      return data;
    })
    .catch(() => null);
}

export function publicBootstrapScript(apiOrigin: string, path: string) {
  return `(${startPublicBootstrap.toString()})(${JSON.stringify(apiOrigin)},${JSON.stringify(path)});`;
}
