import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { cloudflareReader, collectOperations, inspectOperations } from '../operations-monitor';

const [action, clock = '0'] = process.argv.slice(2);
const root = 'http://127.0.0.1:8797';
const directory = '.wrangler/recovery-rehearsal';
const at = new Date().toISOString();
let result: unknown;
if (action === 'monitor' || action === 'monitor-s3') {
  if (!/^(0|32)$/.test(clock))
    throw new Error('Only real time or the 32-day retention fixture clock is supported.');
  const manifest = JSON.parse(readFileSync(`${directory}/manifest.json`, 'utf8')) as {
    accountId: string;
    name: string;
  };
  if (action === 'monitor-s3' && existsSync('.env.recovery-monitor'))
    process.loadEnvFile('.env.recovery-monitor');
  const read =
    action === 'monitor-s3'
      ? cloudflareReader({
          accountId: manifest.accountId,
          bucket: `${manifest.name}-recovery`,
          accessKeyId: process.env.R2_MONITOR_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_MONITOR_SECRET_ACCESS_KEY ?? '',
        })
      : async (path: string) => {
          const response = await fetch(root + path, { signal: AbortSignal.timeout(30_000) });
          if (!response.ok) throw new Error('Independent binding observation failed.');
          return response.json();
        };
  result = inspectOperations(
    await collectOperations(read),
    new Date(Date.now() + Number(clock) * 86_400_000),
  );
} else if (action === 'cron-receipt') {
  result = await (
    await fetch(`${root}/objects/rehearsal/cron.json`, { signal: AbortSignal.timeout(30_000) })
  ).json();
} else {
  if (
    !action ||
    !/^(seed|backup|delete|restore|unsafe|retention|retry|healthy|cron-on|cron-off|stale|recover-monitor|provider-delete|provider-reconcile|checklist-proof|empty)$/.test(
      action,
    )
  )
    throw new Error('Choose a documented rehearsal action.');
  const response = await fetch(`${root}/${action}`, {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
  });
  result = await response.json();
  if (!response.ok) process.exitCode = 1;
}
const record = { at, action, clockOffsetDays: Number(clock), result };
appendFileSync(`${directory}/results.jsonl`, JSON.stringify(record) + '\n');
console.log(JSON.stringify(record));
