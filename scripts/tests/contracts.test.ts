import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { expect, test } from 'vitest';
import {
  assertContract,
  checkProtectedDeclarations,
  type ContractDocument,
} from '../../apps/api/tests/helpers/contracts';
import { assertLocalTarget } from '../local-target';
const document = parse(
  readFileSync('specs/001-radiant-images-website/contracts/openapi.yaml', 'utf8'),
) as ContractDocument;
test('declared errors validate, undeclared status and wrong schemas fail', async () => {
  await expect(
    assertContract(
      document,
      '/inquiries',
      'post',
      Response.json(
        { error: { code: 'email_not_sent', message: 'Not sent', retryable: true } },
        { status: 502 },
      ),
    ),
  ).resolves.toBeUndefined();
  await expect(
    assertContract(
      document,
      '/inquiries',
      'post',
      Response.json(
        { error: { code: 'email_not_sent', message: 'Not sent', retryable: false } },
        { status: 502 },
      ),
    ),
  ).rejects.toThrow();
  await expect(
    assertContract(document, '/inquiries', 'post', Response.json({}, { status: 418 })),
  ).rejects.toThrow();
  await expect(
    assertContract(document, '/inquiries', 'post', Response.json({}, { status: 202 })),
  ).rejects.toThrow();
  await expect(
    assertContract(
      document,
      '/inquiries',
      'post',
      Response.json({ error: { code: 'rate_limited', message: 'Wait' } }, { status: 429 }),
    ),
  ).rejects.toThrow();
});
test.each(['401', '403'])('protected operations must declare %s', (status) => {
  const broken = structuredClone(document);
  const operation = broken.paths['/admin/gallery']?.get as { responses: Record<string, unknown> };
  delete operation.responses[status];
  expect(() => checkProtectedDeclarations(broken)).toThrow();
  expect(() => checkProtectedDeclarations(document)).not.toThrow();
});
test.each([
  'https://production.example',
  'http://127.0.0.1.evil.invalid:8787',
  'http://localhost@evil.invalid',
  'file:///tmp/db',
])('test setup refuses nonlocal target %s', (target) => {
  expect(() => assertLocalTarget(target)).toThrow();
});
test.each(['http://127.0.0.1:8787', 'http://localhost:8787'])(
  'test setup permits explicit loopback %s',
  (target) => {
    expect(() => assertLocalTarget(target)).not.toThrow();
  },
);
