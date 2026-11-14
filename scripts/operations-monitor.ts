import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export type RecoveryObject = {
  key: string;
  size: number;
  last_modified: string;
  custom_metadata?: Record<string, string>;
};
export type MonitorInput = {
  maintenance: unknown;
  backup: unknown;
  health: unknown;
  objects: RecoveryObject[];
};
const DAY = 86_400_000;
const GRACE = 20 * 60_000;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const timestamp = (value: unknown) => (typeof value === 'string' ? Date.parse(value) : NaN);
export function inspectOperations(input: MonitorInput, now: Date) {
  const issues = new Set<string>();
  const counts = {
    overdueRecovery: 0,
    missedRemovalTarget: 0,
    overdueReceipts: 0,
    recoveryBytes: 0,
  };
  const current = now.getTime();
  const fresh = (value: unknown, age: number) => {
    const at = timestamp(value);
    return Number.isFinite(at) && at <= current + 300_000 && current - at <= age;
  };
  for (const [name, value, maxAge] of [
    ['maintenance', input.maintenance, GRACE],
    ['backup', input.backup, 30 * 3_600_000],
  ] as const) {
    if (
      !record(value) ||
      value.version !== 1 ||
      !fresh(value.startedAt, value.status === 'running' ? GRACE : maxAge) ||
      !['ok', 'running'].includes(String(value.status)) ||
      (value.status === 'ok' &&
        (!fresh(value.finishedAt, maxAge) ||
          timestamp(value.finishedAt) < timestamp(value.startedAt)))
    )
      issues.add(`${name}_job_unhealthy`);
  }
  let newestBackup = -Infinity;
  for (const object of input.objects) {
    if (!Number.isSafeInteger(object.size) || object.size < 0) {
      issues.add('recovery_metadata_invalid');
      continue;
    }
    counts.recoveryBytes += object.size;
    const created = timestamp(object.custom_metadata?.createdAt ?? object.last_modified);
    if (!Number.isFinite(created) || created > current + 300_000) {
      issues.add('recovery_metadata_invalid');
      continue;
    }
    if (object.key.startsWith('backups/')) {
      const expires = timestamp(object.custom_metadata?.expiresAt);
      if (!object.custom_metadata?.createdAt || expires !== created + 28 * DAY)
        issues.add('recovery_metadata_invalid');
      else newestBackup = Math.max(newestBackup, created);
    }
    if (object.key.startsWith('backups/') || object.key.startsWith('media-recovery/')) {
      if (current - created >= 28 * DAY + GRACE) counts.overdueRecovery++;
      if (current - created >= 30 * DAY) counts.missedRemovalTarget++;
    }
    if (object.key.startsWith('client-deletions/') && current - created >= 31 * DAY + GRACE)
      counts.overdueReceipts++;
  }
  if (current - newestBackup > 30 * 3_600_000) issues.add('backup_missing_or_stale');
  if (counts.overdueRecovery) issues.add('recovery_cleanup_overdue');
  if (counts.missedRemovalTarget) issues.add('recovery_removal_target_missed');
  if (counts.overdueReceipts) issues.add('receipt_cleanup_overdue');
  // An operational warning, not a billing cap or an account-wide spending guarantee.
  if (counts.recoveryBytes >= 6 * 1024 ** 3) issues.add('recovery_storage_budget');
  if (!record(input.health) || !fresh(input.health.at, 30 * 3_600_000))
    issues.add('health_missing_or_stale');
  else {
    if (input.health.gmail !== 'verified') issues.add('gmail_unavailable');
    const failures = input.health.failures;
    if (
      !record(failures) ||
      ['inquiry', 'auth', 'image'].some(
        (key) =>
          typeof failures[key] !== 'number' ||
          !Number.isSafeInteger(failures[key]) ||
          Number(failures[key]) < 0,
      )
    )
      issues.add('health_invalid');
    else if (['inquiry', 'auth', 'image'].some((key) => Number(failures[key]) > 0))
      issues.add('application_failures');
  }
  return { ok: issues.size === 0, issues: [...issues].sort(), counts };
}

export async function collectOperations(
  read: (suffix: string) => Promise<unknown>,
): Promise<MonitorInput> {
  const [maintenance, backup, health] = await Promise.all([
    read('/objects/operations/maintenance.json'),
    read('/objects/operations/backup.json'),
    read('/objects/health/latest.json'),
  ]);
  const objects: RecoveryObject[] = [];
  const cursors = new Set<string>();
  let cursor = '';
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({ per_page: '1000', ...(cursor ? { cursor } : {}) });
    const value = await read(`/objects?${query}`);
    if (!record(value) || value.success !== true || !Array.isArray(value.result))
      throw new Error('monitor_read_failed');
    for (const item of value.result) {
      if (
        !record(item) ||
        typeof item.key !== 'string' ||
        typeof item.size !== 'number' ||
        typeof item.last_modified !== 'string' ||
        (item.custom_metadata !== undefined &&
          (!record(item.custom_metadata) ||
            Object.values(item.custom_metadata).some((v) => typeof v !== 'string')))
      )
        throw new Error('monitor_metadata_invalid');
      objects.push(item as RecoveryObject);
    }
    const info = value.result_info;
    if (info === undefined || (record(info) && info.is_truncated === false))
      return { maintenance, backup, health, objects };
    if (
      !record(info) ||
      info.is_truncated !== true ||
      typeof info.cursor !== 'string' ||
      !info.cursor ||
      cursors.has(info.cursor)
    )
      throw new Error('monitor_pagination_invalid');
    cursor = info.cursor;
    cursors.add(cursor);
  }
  throw new Error('monitor_inventory_limit');
}

export function cloudflareReader(
  config: { accountId: string; bucket: string; token: string },
  fetcher: typeof fetch = fetch,
) {
  if (
    !/^[a-f0-9]{32}$/.test(config.accountId) ||
    !/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(config.bucket) ||
    !config.token
  )
    throw new Error('monitor_configuration_missing');
  const root = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucket}`;
  return async (suffix: string): Promise<unknown> => {
    if (!suffix.startsWith('/objects')) throw new Error('monitor_path_invalid');
    const response = await fetcher(root + suffix, {
      headers: { Authorization: `Bearer ${config.token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 404) {
      await response.body?.cancel();
      return null;
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Error('monitor_read_failed');
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 2 * 1024 * 1024) {
        await reader.cancel();
        throw new Error('monitor_response_limit');
      }
      chunks.push(chunk.value);
    }
    const combined = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(combined));
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const read = cloudflareReader({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      bucket: process.env.RECOVERY_BUCKET ?? '',
      token: process.env.CLOUDFLARE_MONITOR_TOKEN ?? '',
    });
    const result = inspectOperations(await collectOperations(read), new Date());
    // Fixed issue codes and aggregate counts only; no keys, addresses, responses or credentials.
    console.log(JSON.stringify(result));
    process.exitCode = result.ok ? 0 : 1;
  } catch {
    console.error(
      'Operations monitor could not verify private recovery status. Check credentials, connectivity and inventory; no healthy result is assumed.',
    );
    process.exitCode = 1;
  }
}
