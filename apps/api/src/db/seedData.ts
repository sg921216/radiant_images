import rows from './local-seed.json';
export async function seedLocalDatabase(db: D1Database, local: boolean): Promise<void> {
  if (!local) throw new Error('Synthetic seeding is local-only');
  await db.batch(rows.map((row) => db.prepare(row.sql).bind(...row.values)));
}
