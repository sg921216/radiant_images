import sharp from 'sharp';
export async function performanceImage(
  seed: number,
  edge: number,
  portrait: boolean,
  min: number,
  max: number,
): Promise<Buffer> {
  const width = portrait ? Math.round((edge * 2) / 3) : edge,
    height = portrait ? edge : Math.round((edge * 2) / 3);
  const pixels = Buffer.alloc(width * height * 3);
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let attempt = 0; attempt < 16; attempt++) {
    state = seed >>> 0;
    const amplitude = (edge === 2000 ? 32 : edge === 800 ? 56 : 110) - attempt * 0.5;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        for (let channel = 0; channel < 3; channel++)
          pixels[(y * width + x) * 3 + channel] = Math.round(
            Math.max(
              0,
              Math.min(
                255,
                120 +
                  45 * Math.sin((x / width) * 8 + channel + seed) +
                  30 * Math.cos((y / height) * 7 + seed) +
                  (random() - 0.5) * amplitude,
              ),
            ),
          );
    let low = 1,
      high = 100;
    while (low <= high) {
      const quality = Math.floor((low + high) / 2);
      const bytes = await sharp(pixels, { raw: { width, height, channels: 3 } })
        .webp({ quality, effort: 3 })
        .toBuffer();
      if (bytes.length >= min && bytes.length <= max) return bytes;
      if (bytes.length < min) low = quality + 1;
      else high = quality - 1;
    }
  }
  throw new Error(`Unable to fit synthetic asset ${seed}/${edge} to byte budget`);
}
