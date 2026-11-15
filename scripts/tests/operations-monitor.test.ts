import { expect, test } from 'vitest';
import {
  inspectOperations,
  collectOperations,
  cloudflareReader,
  type MonitorInput,
} from '../operations-monitor';
const now = new Date('2026-11-14T12:00:00Z');
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
function healthy(): MonitorInput {
  return {
    maintenance: { version: 1, status: 'ok', startedAt: ago(0), finishedAt: ago(0) },
    backup: { version: 1, status: 'ok', startedAt: ago(0), finishedAt: ago(0) },
    health: { at: ago(0), gmail: 'verified', failures: { inquiry: 0, auth: 0, image: 0 } },
    objects: [
      {
        key: 'backups/synthetic.json',
        size: 300,
        last_modified: ago(0),
        custom_metadata: { createdAt: ago(0), expiresAt: ago(-28) },
      },
    ],
  };
}
test('a healthy heartbeat cannot conceal missing backups or expired recovery objects', () => {
  const input = healthy();
  input.objects = [
    { key: 'media-recovery/private-id/original', size: 400, last_modified: ago(30.1) },
    { key: 'client-deletions/private-id.json', size: 200, last_modified: ago(32) },
  ];
  const result = inspectOperations(input, now);
  expect(result.ok).toBe(false);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      'backup_missing_or_stale',
      'recovery_cleanup_overdue',
      'recovery_removal_target_missed',
      'receipt_cleanup_overdue',
    ]),
  );
  expect(result.counts).toMatchObject({
    overdueRecovery: 1,
    missedRemovalTarget: 1,
    overdueReceipts: 1,
  });
  expect(JSON.stringify(result)).not.toContain('private-id');
});
test('missing, failed, stuck and future-dated signals fail closed', () => {
  for (const maintenance of [
    null,
    { version: 1, status: 'error', startedAt: ago(0), finishedAt: ago(0) },
    { version: 1, status: 'running', startedAt: ago(1) },
    { version: 1, status: 'ok', startedAt: ago(-1), finishedAt: ago(-1) },
  ]) {
    expect(inspectOperations({ ...healthy(), maintenance }, now).ok).toBe(false);
  }
});
test('fresh backups and signals pass; recovery budget and health failures are bounded alerts', () => {
  expect(inspectOperations(healthy(), now).ok).toBe(true);
  const input = healthy();
  input.objects[0]!.size = 7 * 1024 ** 3;
  input.health = { at: ago(0), gmail: 'unavailable', failures: { inquiry: 2, auth: 0, image: 0 } };
  const result = inspectOperations(input, now);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      'recovery_storage_budget',
      'gmail_unavailable',
      'application_failures',
    ]),
  );
});

test('independent collector reads every inventory page and rejects broken or repeating cursors', async () => {
  const input = healthy();
  let pages = 0;
  const read = async (suffix: string) => {
    if (suffix.includes('maintenance.json')) return input.maintenance;
    if (suffix.includes('backup.json')) return input.backup;
    if (suffix.includes('health/latest.json')) return input.health;
    pages++;
    return pages === 1
      ? { success: true, result: [], result_info: { is_truncated: true, cursor: 'next/+' } }
      : { success: true, result: input.objects };
  };
  expect(inspectOperations(await collectOperations(read), now).ok).toBe(true);
  expect(pages).toBe(2);
  await expect(
    collectOperations(async (suffix) =>
      suffix.includes('?')
        ? { success: true, result: [], result_info: { is_truncated: true, cursor: 'same' } }
        : null,
    ),
  ).rejects.toThrow('monitor_pagination_invalid');
  await expect(collectOperations(async () => ({ success: false }))).rejects.toThrow(
    'monitor_read_failed',
  );
});

test('monitor transport uses read-only fixed-origin calls and rejects provider errors and oversized bodies', async () => {
  const config = {
    accountId: 'a'.repeat(32),
    bucket: 'synthetic-recovery',
    accessKeyId: 'synthetic-access-key',
    secretAccessKey: 'synthetic-secret-key',
  };
  const read = cloudflareReader(config, async (input, init) => {
    const request = new Request(input, init);
    expect(new URL(request.url).origin).toBe(
      `https://${config.accountId}.r2.cloudflarestorage.com`,
    );
    expect(request.method).toBe('GET');
    expect(request.redirect).toBe('error');
    expect(request.headers.get('Authorization')).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(request.headers.get('Authorization')).toContain('/auto/s3/aws4_request');
    return Response.json({ version: 1 });
  });
  expect(await read('/objects/operations/maintenance.json')).toEqual({ version: 1 });
  await expect(
    cloudflareReader(
      config,
      async () => new Response('private provider detail', { status: 403 }),
    )('/objects/operations/maintenance.json'),
  ).rejects.toThrow('monitor_read_failed');
  await expect(
    cloudflareReader(
      config,
      async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1)),
    )('/objects/operations/maintenance.json'),
  ).rejects.toThrow('monitor_response_limit');
});

const storageConfig = {
  accountId: 'a'.repeat(32),
  bucket: 'synthetic-recovery',
  accessKeyId: 'synthetic-access-key',
  secretAccessKey: 'synthetic-secret-key',
};
function listing(contents: string, truncated = false, cursor = '') {
  return `<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>synthetic-recovery</Name><IsTruncated>${truncated}</IsTruncated>${cursor ? `<NextContinuationToken>${cursor}</NextContinuationToken>` : ''}${contents}</ListBucketResult>`;
}
const backupItem = `<Contents><Key>backups/synthetic.json</Key><LastModified>${ago(0)}</LastModified><ETag>"synthetic-etag"</ETag><Size>300</Size></Contents>`;

test('bucket-scoped S3 collection paginates and reads backup metadata without downloading private bodies', async () => {
  const requests: string[] = [];
  const read = cloudflareReader(storageConfig, async (input, init) => {
    const request = new Request(input, init),
      url = new URL(request.url);
    requests.push(`${request.method} ${url.pathname}`);
    expect(url.origin).toBe(`https://${storageConfig.accountId}.r2.cloudflarestorage.com`);
    expect(request.headers.get('Authorization')).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(['GET', 'HEAD']).toContain(request.method);
    expect(request.redirect).toBe('error');
    if (url.pathname.endsWith('/operations/maintenance.json'))
      return Response.json(healthy().maintenance);
    if (url.pathname.endsWith('/operations/backup.json')) return Response.json(healthy().backup);
    if (url.pathname.endsWith('/health/latest.json')) return Response.json(healthy().health);
    if (url.pathname.endsWith('/backups/synthetic.json')) {
      expect(request.method).toBe('HEAD');
      expect(request.headers.get('If-Match')).toBe('"synthetic-etag"');
      return new Response(null, {
        headers: {
          'x-amz-meta-createdat': ago(0),
          'x-amz-meta-expiresat': ago(-28),
        },
      });
    }
    expect(url.pathname).toBe('/synthetic-recovery');
    expect(url.searchParams.get('list-type')).toBe('2');
    expect(url.searchParams.get('max-keys')).toBe('1000');
    const cursor = url.searchParams.get('continuation-token');
    if (!cursor) return new Response(listing('', true, 'next/+&amp;='));
    expect(cursor).toBe('next/+&=');
    return new Response(listing(backupItem));
  });
  expect(inspectOperations(await collectOperations(read), now).ok).toBe(true);
  expect(requests).toHaveLength(6);
  expect(requests.filter((value) => value.includes('/backups/'))).toEqual([
    'HEAD /synthetic-recovery/backups/synthetic.json',
  ]);
});

test('S3 inventory rejects malformed XML, entities, invalid metadata and missing pagination', async () => {
  for (const body of [
    '<ListBucketResult>',
    '<!DOCTYPE x [<!ENTITY private "secret">]><ListBucketResult>&private;</ListBucketResult>',
    '<ListBucketResult><Name>synthetic-recovery</Name></ListBucketResult>',
    listing('<Contents><Key>private</Key><Size>-1</Size></Contents>'),
    listing('', true),
    '<Error><Code>AccessDenied</Code></Error>',
  ]) {
    const read = cloudflareReader(storageConfig, async () => new Response(body));
    await expect(
      collectOperations(async (suffix) => (suffix.includes('?') ? read(suffix) : null)),
    ).rejects.toThrow();
  }
});

test('monitor cannot request private bodies, arbitrary query parameters or another bucket', async () => {
  let requests = 0;
  const read = cloudflareReader(storageConfig, async () => {
    requests++;
    return Response.json({});
  });
  for (const suffix of [
    '/objects/backups/private.json',
    '/objects/client-deletions/private.json',
    '/objects/../other-bucket',
    '/objects?prefix=private',
    '/objects?per_page=1000&cursor=x&delimiter=/',
  ])
    await expect(read(suffix)).rejects.toThrow('monitor_path_invalid');
  expect(requests).toBe(0);
});

test('repeated job starts cannot hide a missing or stale successful completion', () => {
  for (const lastSucceededAt of [undefined, ago(1)]) {
    const maintenance = { version: 1, status: 'running', startedAt: ago(0), lastSucceededAt };
    expect(inspectOperations({ ...healthy(), maintenance }, now).issues).toContain(
      'maintenance_job_unhealthy',
    );
  }
  const maintenance = {
    version: 1,
    status: 'running',
    startedAt: ago(0),
    lastSucceededAt: ago(0.005),
  };
  expect(inspectOperations({ ...healthy(), maintenance }, now).ok).toBe(true);
});
