import { expect, test } from 'vitest';
import { consentUrl } from '../gmail-consent';
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
