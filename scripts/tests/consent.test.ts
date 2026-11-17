import { expect, test } from 'vitest';
import { mkdtemp, readFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consentUrl, saveConsentToken } from '../gmail-consent';
test('consent uses loopback callback, offline access, explicit scopes, state and PKCE', () => {
  expect(() =>
    consentUrl('client', 'https://remote.invalid/callback', 'state', 'challenge'),
  ).toThrow();
  const url = new URL(consentUrl('client', 'http://127.0.0.1:8085/callback', 'state', 'challenge'));
  expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('scope')?.split(' ')).toEqual([
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.settings.basic',
  ]);
  expect(url.searchParams.get('access_type')).toBe('offline');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('state')).toBe('state');
});

test('partial Gmail consent cannot save a token or appear complete', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'radiant-consent-'));
  const output = join(directory, 'refresh.secret');
  try {
    for (const scope of [
      undefined,
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.settings.basic',
    ]) {
      await expect(
        saveConsentToken({ refresh_token: 'test-token', scope }, output),
      ).rejects.toThrow('Grant both requested Gmail permissions');
      await expect(readFile(output)).rejects.toMatchObject({ code: 'ENOENT' });
    }
    const scope =
      'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.settings.basic';
    await saveConsentToken({ refresh_token: 'test-token', scope }, output);
    expect(await readFile(output, 'utf8')).toBe('test-token\n');
    await expect(
      saveConsentToken({ refresh_token: 'replacement', scope }, output),
    ).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(output, 'utf8')).toBe('test-token\n');
  } finally {
    await rm(output, { force: true });
    await rmdir(directory);
  }
});
