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
    token: 'synthetic-token',
  };
  const read = cloudflareReader(config, async (input, init) => {
    expect(String(input)).toMatch(/^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\//);
    expect(init?.method).toBeUndefined();
    expect(init?.redirect).toBe('error');
    return Response.json({ version: 1 });
  });
  expect(await read('/objects/operations/maintenance.json')).toEqual({ version: 1 });
  await expect(
    cloudflareReader(
      config,
      async () => new Response('private provider detail', { status: 403 }),
    )('/objects'),
  ).rejects.toThrow('monitor_read_failed');
  await expect(
    cloudflareReader(
      config,
      async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1)),
    )('/objects'),
  ).rejects.toThrow('monitor_response_limit');
});
