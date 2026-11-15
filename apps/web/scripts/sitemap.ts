import { mkdir, writeFile } from 'node:fs/promises';
const origin = new URL(process.env.VITE_WEB_ORIGIN || 'http://127.0.0.1:5173').origin;
const paths = ['/', '/maternity', '/newborn', '/family', '/about', '/contact', '/faq'];
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join('') +
  '</urlset>\n';
await mkdir('build/client', { recursive: true });
await writeFile('build/client/sitemap.xml', xml);
await writeFile(
  'build/client/robots.txt',
  `User-agent: *\nDisallow: /admin\nDisallow: /q/\nSitemap: ${origin}/sitemap.xml\n`,
);
