import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import rows from './local-seed.json';
// CLI has no remote mode; this module is never imported into the deployed Worker.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const directory = mkdtempSync(resolve(tmpdir(), 'radiant-synthetic-seed-'));
const file = resolve(directory, 'seed.sql');
function literal(value: string | number) {
  return typeof value === 'number' ? String(value) : "'" + value.replaceAll("'", "''") + "'";
}
const sql = rows
  .map((row) => {
    let index = 0;
    return row.sql.replace(/\?/g, () => literal(row.values[index++]!)) + ';';
  })
  .join('\n');
writeFileSync(file, sql);
try {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, 'node_modules/wrangler/bin/wrangler.js'),
      'd1',
      'execute',
      'DB',
      '--local',
      '--config',
      resolve(root, 'apps/api/wrangler.toml'),
      '--file',
      file,
    ],
    { stdio: 'inherit', env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' } },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(file);
}
