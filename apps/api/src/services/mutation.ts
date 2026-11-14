import { ulid } from 'ulid';
import { audit, fallbackAudit, sanitizedDetail, type AuditEvent } from './audit';
export async function auditedMutation(
  db: D1Database,
  statements: D1PreparedStatement[],
  event: AuditEvent,
) {
  const entry = db
    .prepare(
      'INSERT INTO audit_events (id,actor,action,outcome,request_id,entity_type,entity_id,detail) VALUES(?,?,?,?,?,?,?,?)',
    )
    .bind(
      ulid(),
      event.actor,
      event.action,
      'ok',
      event.requestId,
      event.entityType ?? null,
      event.entityId ?? null,
      JSON.stringify(sanitizedDetail(event.detail)),
    );
  try {
    await db.batch([...statements, entry]);
  } catch (error) {
    try {
      await audit(db, { ...event, outcome: 'error', detail: { code: 'mutation_failed' } });
    } catch {
      fallbackAudit(event, 'audit_write_failed');
    }
    throw error;
  }
}
