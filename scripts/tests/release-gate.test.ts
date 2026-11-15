import { expect, test } from 'vitest';
import { releaseGate } from '../release-gate';
test('release refuses unfinished acceptance and synthetic or non-HTTPS deployment values', () => {
  const valid = {
    WEB_ORIGIN: 'https://photos.release-fixture.dev',
    API_ORIGIN: 'https://api.release-fixture.dev',
    PUBLIC_CONTACT_EMAIL: 'hello@release-fixture.dev',
    TURNSTILE_SITE_KEY: 'actual-public-site-key',
  };
  expect(() => releaseGate('- [ ] T001 unresolved', valid)).toThrow();
  expect(() =>
    releaseGate('- [X] T001 verified', { ...valid, WEB_ORIGIN: 'http://localhost:5173' }),
  ).toThrow();
  expect(() =>
    releaseGate('- [X] T001 verified', { ...valid, PUBLIC_CONTACT_EMAIL: 'hello@example.invalid' }),
  ).toThrow();
  expect(() =>
    releaseGate('- [X] T001 verified', {
      ...valid,
      TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    }),
  ).toThrow();
  expect(() => releaseGate('- [X] T001 verified', valid)).not.toThrow();
  for (const host of [
    'photos.example.com',
    'api.example.test',
    'example.org',
    'site.local',
    '[::1]',
    '10.0.0.1',
  ])
    expect(() =>
      releaseGate('- [X] T001 verified', { ...valid, WEB_ORIGIN: `https://${host}` }),
    ).toThrow();
  for (const email of ['hello@example.com', 'hello@site.test', 'hello@example.org'])
    expect(() =>
      releaseGate('- [X] T001 verified', { ...valid, PUBLIC_CONTACT_EMAIL: email }),
    ).toThrow();
});
