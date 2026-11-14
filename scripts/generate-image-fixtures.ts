import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
// Generated solid-color fixtures contain no photographs, client data or external assets.
const directory = 'e2e/fixtures/images';
await mkdir(directory, { recursive: true });
const source = sharp({
  create: { width: 60, height: 40, channels: 3, background: { r: 156, g: 175, b: 136 } },
});
const original = await source.clone().png().toBuffer();
const webp = await source.clone().webp().toBuffer();
const metadata = await source
  .clone()
  .withMetadata({ exif: { IFD0: { Artist: 'Synthetic metadata fixture' } } })
  .webp()
  .toBuffer();
const oriented = await source
  .clone()
  .withMetadata({ orientation: 6, exif: { IFD0: { Artist: 'Synthetic metadata fixture' } } })
  .jpeg()
  .toBuffer();
await writeFile(`${directory}/synthetic.png`, original);
await writeFile(`${directory}/oriented.jpg`, oriented);
await writeFile(
  `${directory}/fixtures.json`,
  JSON.stringify(
    {
      original: original.toString('base64'),
      webp: webp.toString('base64'),
      metadata: metadata.toString('base64'),
      oriented: oriented.toString('base64'),
    },
    null,
    2,
  ) + '\n',
);
