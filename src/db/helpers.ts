/**
 * First row of an update/delete `.returning()` result, or throw.
 *
 * Prisma's `update` and `delete` reject when the record doesn't exist; Drizzle
 * silently affects zero rows. Actions use this to keep failing loudly instead
 * of auditing a change that never happened.
 */
export function expectRow<T>(rows: T[], entity: string): T {
  const [row] = rows;
  if (!row) throw new Error(`${entity} not found`);
  return row;
}
