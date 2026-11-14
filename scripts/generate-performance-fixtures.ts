import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { performanceImage } from './performance-fixtures';
const directory = 'e2e/fixtures/performance';
await mkdir(directory, { recursive: true });
const images = [];
for (let index = 0; index < 60; index++) {
  const id = `01PERF${String(index).padStart(20, '0')}`,
    portrait = index % 2 === 0;
  const variants: Record<
    string,
    { file: string; width: number; height: number; bytes: number; sha256: string }
  > = {};
  for (const [name, edge, min, max] of [
    ['full', 2000, 150, 160],
    ['card', 800, 56, 64],
    ['thumb', 320, 12, 16],
  ] as const) {
    const bytes = await performanceImage(index + 1, edge, portrait, min * 1024, max * 1024),
      file = `${String(index + 1).padStart(2, '0')}-${name}.webp`,
      info = await sharp(bytes).metadata();
    await writeFile(`${directory}/${file}`, bytes);
    variants[name] = {
      file,
      width: info.width!,
      height: info.height!,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  }
  images.push({
    id,
    tag: ['maternity', 'newborn', 'family'][Math.floor(index / 20)],
    altText: `Synthetic ${portrait ? 'portrait' : 'landscape'} texture ${index + 1}, curved multicolored bands`,
    sortOrder: index,
    variants,
  });
  if ((index + 1) % 10 === 0) console.log(`Generated ${index + 1}/60 synthetic load fixtures`);
}
await writeFile(
  `${directory}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      kind: 'synthetic-load-only',
      approvedPhotos: false,
      generator: 'sharp 0.35.5; deterministic LCG texture v1',
      images,
    },
    null,
    2,
  ) + '\n',
);
