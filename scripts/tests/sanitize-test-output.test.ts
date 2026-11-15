import { expect, test } from 'vitest';
import { sanitizeTestOutput } from '../sanitize-test-output';
test('test diagnostics remove token paths, exchange fragments and bearer values while retaining useful route context', () => {
  const secret = 'a'.repeat(43);
  const source = `Failed GET https://example.invalid/q/${secret}\nPOST /questionnaire/${secret}\n/admin/callback#code=${secret}\nAuthorization: Bearer ${secret}\nExpected 201, received 500`;
  const output = sanitizeTestOutput(source);
  expect(output.includes(secret)).toBe(false);
  expect(output).toContain('/q/[redacted]');
  expect(output).toContain('Expected 201, received 500');
});
