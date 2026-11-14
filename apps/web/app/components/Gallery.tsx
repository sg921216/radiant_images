import type { GalleryImage, ShootType } from '@radiant/shared';
import { useState } from 'react';
function Picture({ image, index }: { image: GalleryImage; index: number }) {
  const [failed, setFailed] = useState(false);
  const edge = Math.max(image.width, image.height);
  const width = (cap: number) => Math.round(image.width * Math.min(1, cap / edge));
  return (
    <figure style={{ aspectRatio: `${image.width}/${image.height}` }}>
      {failed ? (
        <div className="image-failure" role="img" aria-label={image.altText}>
          <p>Image unavailable</p>
          <p>{image.altText}</p>
        </div>
      ) : (
        <img
          src={image.urls.card}
          srcSet={`${image.urls.thumb} ${width(320)}w, ${image.urls.card} ${width(800)}w, ${image.urls.full} ${image.width}w`}
          sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw"
          width={image.width}
          height={image.height}
          alt={image.altText}
          loading={index < 2 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  );
}
export function Gallery({
  images,
  tag,
  loading,
}: {
  images: GalleryImage[];
  tag?: ShootType;
  loading?: boolean;
}) {
  if (loading)
    return (
      <div className="gallery-loading" role="status">
        Loading photographs…
      </div>
    );
  const visible = images
    .filter((image) => !tag || image.tag === tag)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return visible.length ? (
    <div className="gallery">
      {visible.map((image, index) => (
        <Picture key={image.id} image={image} index={index} />
      ))}
    </div>
  ) : (
    <p className="gallery-empty">Photographs will appear here as the collection is published.</p>
  );
}
