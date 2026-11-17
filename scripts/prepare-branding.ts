import { mkdir, writeFile, copyFile, readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderBrandingPage, validateBrandingConfig } from '../apps/web/app/routes/branding';

const config: { origin: string; contactEmail: string } = JSON.parse(
  await readFile('apps/web/branding.json', 'utf-8'),
);
validateBrandingConfig(config);
const output = resolve('apps/web/dist/branding');
await mkdir(output, { recursive: true });
// Refuse stale or unrelated output instead of accidentally publishing application files.
const themeImages = ['lavender-sprig.webp', 'stationery-480.webp', 'stationery-960.webp'];
const allowed = [
  'index.html',
  'privacy.html',
  '404.html',
  'styles.css',
  'logo-320.webp',
  'logo-640.webp',
  ...themeImages,
  '_headers',
  'robots.txt',
  'sitemap.xml',
];
for (const entry of await readdir(output)) {
  if (!allowed.includes(entry))
    throw new Error('Unexpected file in branding output; inspect it before continuing.');
}
for (const [path, file] of [
  ['/', 'index.html'],
  ['/privacy', 'privacy.html'],
] as const) {
  await writeFile(resolve(output, file), renderBrandingPage(path, config));
}
await writeFile(
  resolve(output, '404.html'),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Radiant Images</title><link rel="stylesheet" href="/styles.css"></head><body><main><h1>Page not found</h1><a href="/">Return home</a></main></body></html>',
);
const styles = await Promise.all(
  ['brand.css', 'branding.css'].map((name) => readFile(`apps/web/app/styles/${name}`, 'utf-8')),
);
await writeFile(resolve(output, 'styles.css'), styles.join('\n'));
for (const file of themeImages) await copyFile(`apps/web/public/${file}`, resolve(output, file));
for (const size of [320, 640])
  await copyFile(`apps/web/assets/logo-${size}.webp`, resolve(output, `logo-${size}.webp`));
await writeFile(
  resolve(output, '_headers'),
  `/*
  Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: public, max-age=0, must-revalidate, no-transform
`,
);
const origin = new URL(config.origin).origin;
await writeFile(
  resolve(output, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
await writeFile(
  resolve(output, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/privacy</loc></url></urlset>`,
);
console.log('Prepared homepage and privacy assets only. No deployment performed.');
