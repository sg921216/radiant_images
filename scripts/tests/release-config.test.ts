import { expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

test('prepared deployment config keeps owner allowlist and Google credentials in Worker secrets', () => {
  const parent = realpathSync(tmpdir());
  const directory = realpathSync(mkdtempSync(join(parent, 'radiant-release-test-')));
  if (dirname(directory) !== parent || !basename(directory).startsWith('radiant-release-test-'))
    throw Error('Unsafe temporary cleanup path');
  try {
    mkdirSync(join(directory, 'specs/001-radiant-images-website'), { recursive: true });
    writeFileSync(
      join(directory, 'specs/001-radiant-images-website/tasks.md'),
      '- [X] T001 Synthetic completed fixture\n',
    );
    execFileSync(
      process.execPath,
      [
        '--import',
        pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href,
        resolve('scripts/prepare-release.ts'),
        'api',
      ],
      {
        cwd: directory,
        env: {
          ...process.env,
          WEB_ORIGIN: 'https://web.release-fixture.dev',
          API_ORIGIN: 'https://api.release-fixture.dev',
          PUBLIC_CONTACT_EMAIL: 'hello@release-fixture.dev',
          TURNSTILE_SITE_KEY: 'fixture-approved-site-key',
          API_WORKER_NAME: 'fixture-api',
          D1_DATABASE_NAME: 'fixture-db',
          D1_DATABASE_ID: 'fixture-id',
          MEDIA_BUCKET: 'fixture-media',
          RECOVERY_BUCKET: 'fixture-recovery',
          OWNER_ALLOWLIST: 'owner@example.test',
          GOOGLE_CLIENT_ID: 'fixture-client-id',
        },
        stdio: 'pipe',
      },
    );
    const config = JSON.parse(
      readFileSync(join(directory, '.wrangler/release-api.jsonc'), 'utf-8'),
    );
    expect(config.vars).not.toHaveProperty('OWNER_ALLOWLIST');
    expect(config.vars).not.toHaveProperty('GOOGLE_CLIENT_ID');
    expect(config.vars.WEB_ORIGIN).toBe('https://web.release-fixture.dev');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
