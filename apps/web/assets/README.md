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

## Additional supplied materials (2026-11-17)

See [content intake](../../../specs/001-radiant-images-website/content-intake.md)
for the portfolio inventory, brand/contact discrepancies, pricing draft and permission
gaps. Originals remain unchanged and must not be copied into public assets. Prepared
upload candidates live only in ignored `.wrangler/asset-review/uploads/`; the tracked
evidence manifest records their hashes and proposed alt text. All 17 supplied photos
are maternity images. Final selection and usage permission remain T063 gates.

## Moodboard artwork on the homepage

The collection heading uses a 200-pixel WebP detail from the supplied
`Monochrome Lavender Sprig Sketch.png`. The decorative stationery still life was
created with the built-in ImageGen tool. Both homepages use the same responsive
480- and 960-pixel WebP versions.

[Lavender drawing](../public/lavender-sprig.webp) · [Small still life](../public/stationery-480.webp) · [Large still life](../public/stationery-960.webp)

Generation prompt:

> A warm, natural-light editorial still life for a photography studio. Close-up of a deckle-edged ivory envelope on loosely folded dusty sage linen, sealed with a vintage wine wax seal embossed with a lavender sprig. A few dried lavender stems rest diagonally across the envelope. Square composition, rich tactile detail, soft afternoon shadows, quiet nostalgic mood. No lettering or people.
