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

type ProfileListColumn =
  | "courseCompletedIds"
  | "certificationIds"
  | "languagesKnown"
  | "skillIds";

/**
 * The CandidateProfile list columns are nullable in the database (as Prisma
 * created them), but the app always treats them as lists. Read a missing
 * list as empty.
 */
export function withProfileLists<
  T extends { [K in ProfileListColumn]: string[] | null },
>(profile: T): Omit<T, ProfileListColumn> & { [K in ProfileListColumn]: string[] } {
  return {
    ...profile,
    courseCompletedIds: profile.courseCompletedIds ?? [],
    certificationIds: profile.certificationIds ?? [],
    languagesKnown: profile.languagesKnown ?? [],
    skillIds: profile.skillIds ?? [],
  };
}
