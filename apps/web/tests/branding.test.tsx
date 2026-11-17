import { expect, test } from 'vitest';
import { renderBrandingPage, validateBrandingConfig } from '../app/routes/branding';

const config = { origin: 'https://photos.example.com', contactEmail: 'hello@example.com' };

test('homepage identifies the business and owner-only application without requiring JavaScript', () => {
  const html = renderBrandingPage('/', config);
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(document.querySelector('h1')?.textContent).toContain('Keep the feeling');
  expect(document.body.textContent).toContain('Rebekah');
  expect(document.body.textContent).toContain('owner');
  expect(document.querySelector('a[href="/privacy"]')).not.toBeNull();
  expect(document.querySelector('a[href="mailto:hello@example.com"]')).not.toBeNull();
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
    config.origin + '/',
  );
  expect(document.querySelectorAll('script, iframe, form').length).toBe(0);
  expect(document.querySelector('img')?.getAttribute('alt')).toContain('Radiant Images');
});

test('privacy explains the actual Gmail use, lifecycle, revocation and separate provider boundaries', () => {
  const html = renderBrandingPage('/privacy', config);
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(document.querySelector('h1')?.textContent).toBe('Privacy policy');
  for (const text of [
    'gmail.send',
    'gmail.settings.basic',
    'send-as',
    '28 days',
    '30 days',
    '31 days',
    'Pixieset',
    'Limited Use',
    'revoke',
    'mailbox',
  ]) {
    expect(document.body.textContent).toContain(text);
  }
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
    config.origin + '/privacy',
  );
  expect(
    document.querySelector('a[href="https://myaccount.google.com/connections"]'),
  ).not.toBeNull();
  expect(document.querySelector('a[href="mailto:hello@example.com"]')).not.toBeNull();
});

test.each([
  { origin: 'http://photos.example.com', contactEmail: 'hello@example.com' },
  { origin: 'https://photos.example.com/path', contactEmail: 'hello@example.com' },
  { origin: 'https://user:password@photos.example.com', contactEmail: 'hello@example.com' },
  { origin: 'https://replace-me.invalid', contactEmail: 'hello@example.com' },
  { origin: 'https://photos.example.com', contactEmail: 'hello@example.invalid' },
  { origin: 'https://photos.example.com', contactEmail: 'bad\r\n@example.com' },
])('rejects unsafe or placeholder publication settings: $origin / $contactEmail', (input) => {
  expect(() => validateBrandingConfig(input)).toThrow();
});

test('escapes configuration in static HTML and rejects unknown page routes', () => {
  expect(() => renderBrandingPage('/admin', config)).toThrow();
  expect(renderBrandingPage('/', { ...config, contactEmail: "o'hara@example.com" })).not.toContain(
    '<script',
  );
});
