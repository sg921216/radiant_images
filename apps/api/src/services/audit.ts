import { ulid } from 'ulid';
export interface AuditEvent {
  actor: string;
  action: string;
  outcome: 'ok' | 'error';
  requestId: string;
  entityType?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}
export function sanitizedDetail(detail: Record<string, unknown> = {}) {
  const safe: Record<string, string | number> = {};
  for (const key of ['count', 'durationMs'])
    if (typeof detail[key] === 'number' && Number.isFinite(detail[key])) safe[key] = detail[key];
  if (typeof detail.code === 'string' && /^[a-z_]{1,48}$/.test(detail.code))
    safe.code = detail.code;
  return safe;
}
export async function audit(db: D1Database, event: AuditEvent) {
  await db
    .prepare(
      'INSERT INTO audit_events (id,actor,action,outcome,request_id,entity_type,entity_id,detail) VALUES(?,?,?,?,?,?,?,?)',
    )
    .bind(
      ulid(),
      event.actor,
      event.action,
      event.outcome,
      event.requestId,
      event.entityType ?? null,
      event.entityId ?? null,
      JSON.stringify(sanitizedDetail(event.detail)),
    )
    .run();
}
export function fallbackAudit(
  event: Pick<AuditEvent, 'action' | 'outcome' | 'requestId'>,
  code: string,
) {
  console.error(
    JSON.stringify({
      action: event.action,
      outcome: event.outcome,
      requestId: event.requestId,
      code,
    }),
  );
}
