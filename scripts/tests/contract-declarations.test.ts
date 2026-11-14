import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { expect, test } from 'vitest';
import {
  checkApplicableDeclarations,
  type ContractDocument,
} from '../../apps/api/tests/helpers/contracts';
const document = parse(
  readFileSync('specs/001-radiant-images-website/contracts/openapi.yaml', 'utf8'),
) as ContractDocument;
test('each operation declares all applicable validation, auth, body-size, rate, dependency and maintenance errors', () => {
  expect(() => checkApplicableDeclarations(document)).not.toThrow();
  for (const [path, method, status] of [
    ['/admin/config', 'put', '502'],
    ['/admin/gallery', 'post', '413'],
    ['/admin/clients/{id}/emails', 'post', '504'],
    ['/admin/clients/{id}', 'get', '404'],
    ['/admin/templates', 'get', '401'],
    ['/admin/templates', 'get', '403'],
    ['/inquiries', 'post', '400'],
    ['/inquiries', 'post', '429'],
    ['/public/bootstrap', 'get', '500'],
    ['/public/bootstrap', 'get', '503'],
  ]) {
    const broken = structuredClone(document);
    const operation = broken.paths[path!]![method!] as { responses: Record<string, unknown> };
    delete operation.responses[status!];
    expect(() => checkApplicableDeclarations(broken)).toThrow();
  }
});
