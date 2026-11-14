import { env } from 'cloudflare:workers';
import { expect, test } from 'vitest';
import fixtures from '../../../e2e/fixtures/images/fixtures.json';
const bytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

test('JPEG coordinator validates intact photos and rejects truncation through real Workers RPC', async () => {
  const validator = env.JPEG_VALIDATOR.getByName('synthetic-portfolio');
  const jpeg = bytes(fixtures.oriented);
  expect(await validator.validate(jpeg)).toBe(true);
  expect(await validator.validate(jpeg.slice(0, -20))).toBe(false);
  expect(await validator.validate(Uint8Array.from([...jpeg.slice(0, -20), 255, 217]))).toBe(false);
  expect(await validator.validate(jpeg)).toBe(true);
});
