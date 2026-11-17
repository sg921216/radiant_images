import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { expect, test } from 'vitest';

test('publication build emits only standalone pages and assets with real configured URLs', () => {
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/prepare-branding.ts'], {
    stdio: 'pipe',
  });
  const output = 'apps/web/dist/branding';
  expect(readdirSync(output).sort()).toEqual(
    [
      '404.html',
      '_headers',
      'index.html',
      'logo-320.webp',
      'logo-640.webp',
      'privacy.html',
      'robots.txt',
      'sitemap.xml',
      'styles.css',
    ].sort(),
  );
  const config = JSON.parse(readFileSync('apps/web/branding.json', 'utf-8'));
  expect(readFileSync(`${output}/index.html`, 'utf-8')).toContain(`href="${config.origin}/"`);
  expect(readFileSync(`${output}/privacy.html`, 'utf-8')).toContain(
    `mailto:${config.contactEmail}`,
  );
  expect(readFileSync(`${output}/sitemap.xml`, 'utf-8')).toContain(`${config.origin}/privacy`);
  expect(readFileSync(`${output}/_headers`, 'utf-8')).toContain("default-src 'none'");
  expect(readFileSync(`${output}/_headers`, 'utf-8')).toContain('no-transform');
  for (const file of ['index.html', 'privacy.html']) {
    expect(readFileSync(`${output}/${file}`, 'utf-8')).not.toMatch(
      /<script|localhost|127\.0\.0\.1|\.invalid|__spa-fallback/,
    );
  }
});

test('ordinary application builds preserve the separate branding publication package', () => {
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/prepare-branding.ts'], {
    stdio: 'pipe',
  });
  const webRequire = createRequire(resolve('apps/web/package.json'));
  const cli = resolve(dirname(webRequire.resolve('@react-router/dev/package.json')), 'bin.js');
  execFileSync(process.execPath, [cli, 'build'], { cwd: resolve('apps/web'), stdio: 'pipe' });
  const output = 'apps/web/dist/branding';
  expect(readFileSync(`${output}/privacy.html`, 'utf-8')).toContain('Privacy policy');
}, 30000);
