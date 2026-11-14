import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { securityHeaders } from '../security-headers';
test('CSP hashes every prerendered inline script and permits only the configured API and CAPTCHA origins', () => {
  const script = 'window.synthetic=true;';
  const headers = securityHeaders(
    [`<script>${script}</script><script src="/assets/app.js"></script>`],
    'https://api.example.invalid',
  );
  expect(headers['Content-Security-Policy']).toContain(
    `'sha256-${createHash('sha256').update(script).digest('base64')}'`,
  );
  expect(headers['Content-Security-Policy']).toContain(
    "connect-src 'self' https://api.example.invalid https://challenges.cloudflare.com",
  );
  expect(headers['Content-Security-Policy']).not.toContain("script-src 'unsafe-inline'");
  expect(headers['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
  expect(headers['Content-Security-Policy']).not.toContain("'unsafe-eval'");
  expect(headers['Content-Security-Policy']).toContain('https://challenges.cloudflare.com data:;');
  expect(headers['Referrer-Policy']).toBe('no-referrer');
  expect(() => securityHeaders([], 'https://api.invalid\r\nInjected: yes')).toThrow();
});
