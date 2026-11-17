# Brand assets

`Logo.jpg` is the supplied source artwork (1774 × 887 pixels). Keep it unchanged.
Its SHA-256 is `b3d08a374c860ef9c311e084bd0e45cba9c96c1371b2ecfe4048c52b14c90141`.

The header imports `logo-320.webp` and `logo-640.webp` so Vite fingerprints them and
the browser selects a suitable resolution. Both preserve the source's full 2:1
composition. They are 5,600 and 14,808 bytes respectively. The original JPEG is
476,288 bytes and is not included in the production build.

To regenerate with the repository's pinned Sharp version, run this JavaScript
from the repository root with Node in module mode:

```js
import sharp from 'sharp';

for (const width of [320, 640]) {
  await sharp('apps/web/assets/Logo.jpg')
    .rotate()
    .resize({ width })
    .webp({ quality: 90, effort: 6 })
    .toFile(`apps/web/assets/logo-${width}.webp`);
}
```

Sharp's default output strips source metadata. The CSS blends the white background
with the site's cream while preserving the supplied file and full composition.
The owner confirmed use of this logo on 2026-11-17. Approval of the remaining launch
content stays part of T063.
