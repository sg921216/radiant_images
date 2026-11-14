import { expect, test } from 'vitest';
import sharp from 'sharp';
import { performanceImage } from '../performance-fixtures';
test('synthetic load assets are distinct, metadata-free, dimensioned and within the profile transfer envelope', async () => {
  const a = await performanceImage(1, 320, true, 12 * 1024, 16 * 1024),
    b = await performanceImage(2, 320, true, 12 * 1024, 16 * 1024);
  expect(a.length).toBeGreaterThanOrEqual(12 * 1024);
  expect(a.length).toBeLessThanOrEqual(16 * 1024);
  const info = await sharp(a).metadata();
  expect(info.height).toBe(320);
  expect(info.width).toBe(213);
  expect(info.exif).toBeUndefined();
  expect(a.equals(b)).toBe(false);
});
