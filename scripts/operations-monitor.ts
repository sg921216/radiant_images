import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AwsClient } from 'aws4fetch';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

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
      (value.status === 'running' &&
        (!fresh(value.lastSucceededAt, maxAge) ||
          timestamp(value.lastSucceededAt) > timestamp(value.startedAt))) ||
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
  config: { accountId: string; bucket: string; accessKeyId: string; secretAccessKey: string },
  fetcher: typeof fetch = fetch,
) {
  if (
    !/^[a-f0-9]{32}$/.test(config.accountId) ||
    !/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(config.bucket) ||
    !config.accessKeyId ||
    !config.secretAccessKey
  )
    throw new Error('monitor_configuration_missing');
  // Object Read Only credentials are bucket-scoped and supported by S3, not the REST API.
  const root = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`;
  const signer = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
  const deadline = Date.now() + 180_000;
  const request = async (path: string, method = 'GET', headers?: Record<string, string>) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('monitor_deadline');
    const signed = await signer.sign(root + path, {
      method,
      ...(headers ? { headers } : {}),
      redirect: 'error',
      signal: AbortSignal.timeout(Math.min(15_000, remaining)),
    });
    // Sign only: the monitor does not inherit aws4fetch's automatic retry policy.
    const response = await fetcher(signed);
    if (response.status === 404 || !response.ok) {
      void response.body?.cancel().catch(() => undefined);
      if (response.status === 404) return null;
      throw new Error('monitor_read_failed');
    }
    return response;
  };
  const boundedText = async (response: Response) => {
    if (!response.body) throw new Error('monitor_read_failed');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 2 * 1024 * 1024) {
        void reader.cancel().catch(() => undefined);
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
    return new TextDecoder().decode(combined);
  };
  const parser = new XMLParser({
    parseTagValue: false,
    trimValues: false,
    isArray: (name) => name === 'Contents',
  });
  const signals = new Set([
    '/objects/operations/maintenance.json',
    '/objects/operations/backup.json',
    '/objects/health/latest.json',
  ]);
  return async (suffix: string): Promise<unknown> => {
    if (signals.has(suffix)) {
      const response = await request(suffix.slice('/objects'.length));
      return response ? JSON.parse(await boundedText(response)) : null;
    }
    if (!/^\/objects\?per_page=1000(?:&cursor=[^&]+)?$/.test(suffix))
      throw new Error('monitor_path_invalid');
    const params = new URLSearchParams(suffix.split('?')[1]);
    const query = new URLSearchParams({ 'list-type': '2', 'max-keys': '1000' });
    if (params.has('cursor')) query.set('continuation-token', params.get('cursor')!);
    const response = await request(`?${query}`);
    if (!response) throw new Error('monitor_read_failed');
    const xml = await boundedText(response);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true)
      throw new Error('monitor_metadata_invalid');
    const document: unknown = parser.parse(xml);
    const page = record(document) ? document.ListBucketResult : undefined;
    if (
      !record(page) ||
      page.Name !== config.bucket ||
      !['true', 'false'].includes(String(page.IsTruncated)) ||
      (page.Contents !== undefined && !Array.isArray(page.Contents)) ||
      page.CommonPrefixes !== undefined
    )
      throw new Error('monitor_metadata_invalid');
    const items = (page.Contents ?? []) as unknown[];
    if (items.length > 1000) throw new Error('monitor_inventory_limit');
    const result: RecoveryObject[] = [];
    for (const item of items) {
      if (
        !record(item) ||
        typeof item.Key !== 'string' ||
        !item.Key ||
        typeof item.LastModified !== 'string' ||
        !Number.isFinite(Date.parse(item.LastModified)) ||
        typeof item.Size !== 'string' ||
        !/^\d+$/.test(item.Size) ||
        !Number.isSafeInteger(Number(item.Size))
      )
        throw new Error('monitor_metadata_invalid');
      const object: RecoveryObject = {
        key: item.Key,
        size: Number(item.Size),
        last_modified: item.LastModified,
      };
      if (object.key.startsWith('backups/')) {
        // S3 lists omit custom metadata. HEAD only immutable backup keys, never their bodies.
        if (!/^backups\/[a-zA-Z0-9_-]+\.json$/.test(object.key) || typeof item.ETag !== 'string')
          throw new Error('monitor_metadata_invalid');
        const head = await request(`/${object.key}`, 'HEAD', { 'If-Match': item.ETag });
        if (!head) throw new Error('monitor_read_failed');
        object.custom_metadata = {
          createdAt: head.headers.get('x-amz-meta-createdat') ?? '',
          expiresAt: head.headers.get('x-amz-meta-expiresat') ?? '',
        };
      }
      result.push(object);
    }
    return {
      success: true,
      result,
      result_info: {
        is_truncated: page.IsTruncated === 'true',
        cursor: page.NextContinuationToken,
      },
    };
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const read = cloudflareReader({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      bucket: process.env.RECOVERY_BUCKET ?? '',
      accessKeyId: process.env.R2_MONITOR_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_MONITOR_SECRET_ACCESS_KEY ?? '',
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
