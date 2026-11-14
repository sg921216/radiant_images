import { createHash } from 'node:crypto';
export function securityHeaders(html: string[], apiOrigin: string): Record<string, string> {
  const url = new URL(apiOrigin);
  if (
    url.origin !== apiOrigin ||
    !['https:', 'http:'].includes(url.protocol) ||
    (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname))
  )
    throw new Error('Invalid API origin');
  const hashes = new Set<string>();
  for (const document of html)
    for (const match of document.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
      if (!/\bsrc\s*=/i.test(match[1]!) && match[2])
        hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  return {
    // react-pdf's bundled Yoga module fetches an embedded data URI and compiles WebAssembly.
    // This permits that module without permitting eval/Function or additional network origins.
    'Content-Security-Policy': `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://challenges.cloudflare.com ${[...hashes].join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' ${apiOrigin} data: blob:; connect-src 'self' ${apiOrigin} https://challenges.cloudflare.com data:; frame-src https://challenges.cloudflare.com; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000',
  };
}
