import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertLocalTarget } from './local-target';
// Fixed local-only command: no remote target or user-supplied CLI flags.
assertLocalTarget(process.env.RADIANT_API_ORIGIN ?? 'http://127.0.0.1:8787');
const result = spawnSync(
  process.execPath,
  [
    resolve('node_modules/wrangler/bin/wrangler.js'),
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--config',
    resolve('e2e/wrangler.toml'),
    '--persist-to',
    resolve('.wrangler/e2e'),
  ],
  { stdio: 'inherit', env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' } },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
