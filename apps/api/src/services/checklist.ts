import type { ChecklistItem } from '@radiant/shared';
export async function listChecklist(db: D1Database) {
  return (
    await db
      .prepare(
        'SELECT id,label,sort_order AS sortOrder FROM checklist_items ORDER BY sort_order,id',
      )
      .all<ChecklistItem>()
  ).results;
}
export function checklistReplacement(db: D1Database, items: ChecklistItem[], now: string) {
  const ids = items.map((item) => item.id);
  return [
    db
      .prepare(
        ids.length
          ? `DELETE FROM checklist_items WHERE id NOT IN (${ids.map(() => '?').join(',')})`
          : 'DELETE FROM checklist_items',
      )
      .bind(...ids),
    ...items.map((item) =>
      db
        .prepare(
          'INSERT INTO checklist_items (id,label,sort_order,created_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET label=excluded.label,sort_order=excluded.sort_order,updated_at=excluded.updated_at',
        )
        .bind(item.id, item.label, item.sortOrder, now, now),
    ),
    db.prepare(
      'INSERT OR IGNORE INTO client_checklist_state (client_id,item_id,completed_at) SELECT c.id,i.id,NULL FROM clients c CROSS JOIN checklist_items i',
    ),
  ];
}
