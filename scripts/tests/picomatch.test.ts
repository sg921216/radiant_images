import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { parseAllDocuments } from 'yaml';
import { coveredByPicomatchPatch } from '../audit-dependencies';

const require = createRequire(import.meta.url);
const matcher = createRequire(require.resolve('vite/package.json'))('picomatch');

test('the installed parser flattens simple wildcard repeats and preserves ordinary file globs', () => {
  for (const [operator, closing] of [
    ['+', ')'],
    ['*', ')?'],
  ] as const) {
    const glob = `photo-${operator}(raw*.jpg).bak`;
    const tokens: { type: string; value: string; output: string }[] = matcher.parse(glob).tokens;
    expect(tokens.find((token) => token.type === 'paren' && token.value === ')')?.output).toBe(
      closing,
    );
    expect(matcher(glob)('photo-raw-edit.jpg.bak')).toBe(true);
    expect(matcher(glob)('photo-.bak')).toBe(operator === '*');
  }
  expect(matcher('photo-+(raw*?.jpg).bak')('photo-raw-edit.jpg.bak')).toBe(false);
  expect(matcher('**/*.{jpg,webp}')('assets/logo.webp')).toBe(true);
  expect(matcher('asset-+(logo).webp')('asset-logologo.webp')).toBe(true);
});

test('the audit exception covers only the locked development copy until a fix is listed', () => {
  const documents = parseAllDocuments(readFileSync('pnpm-lock.yaml', 'utf8'));
  const lock = documents.find((doc) => doc.hasIn(['importers', 'apps/web']))?.toJS();
  const finding = {
    github_advisory_id: 'GHSA-fc5q-39xc-vjpf',
    module_name: 'picomatch',
    patched_versions: null,
    findings: [{ dev: true, version: '4.0.7' }],
  };
  expect(coveredByPicomatchPatch([finding], lock)).toBe(true);
  expect(
    coveredByPicomatchPatch(
      [finding, { ...finding, github_advisory_id: 'another-advisory' }],
      lock,
    ),
  ).toBe(false);
  for (const change of [
    { github_advisory_id: 'another-advisory' },
    { patched_versions: '>=4.0.8' },
    { findings: [{ dev: false, version: '4.0.7' }] },
    { findings: [{ dev: true, version: '4.0.6' }] },
  ]) {
    expect(coveredByPicomatchPatch([{ ...finding, ...change }], lock)).toBe(false);
  }
  expect(coveredByPicomatchPatch([finding], { ...lock, patchedDependencies: {} })).toBe(false);
  expect(
    coveredByPicomatchPatch([finding], {
      ...lock,
      snapshots: { ...lock.snapshots, 'picomatch@4.0.7': {} },
    }),
  ).toBe(false);
});
