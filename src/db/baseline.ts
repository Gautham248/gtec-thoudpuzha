/**
 * Adopt drizzle/ migrations on a database that already has the schema (one
 * created by Prisma before the switch), so `npm run db:migrate` can apply
 * future migrations to it.
 *
 * Drizzle's migrator applies every migration newer than the last row in
 * drizzle.__drizzle_migrations. A Prisma-created database has no such row, so
 * migrate would replay 0000_baseline and fail on objects that already exist.
 * Baselining records 0000_baseline as already applied — exactly the row the
 * migrator itself would have written — after proving the live schema is
 * identical to what that migration builds.
 *
 * Nothing else is written: no app table is touched.
 * Rollback: DROP SCHEMA drizzle CASCADE;
 */
import {
  databaseFromMigrations,
  describe,
  diff,
  migrations,
  pgliteQuery,
  type Query,
} from "./catalog";

export interface Executor {
  query: Query;
  /** Runs `statements` in one transaction. */
  transaction: (statements: string[]) => Promise<void>;
}

export type BaselineResult =
  | { status: "empty-database" }
  | { status: "already-baselined"; rows: number }
  | { status: "schema-mismatch"; differences: string[] }
  | { status: "ready"; hash: string; createdAt: number }
  | { status: "baselined"; hash: string; createdAt: number };

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

export async function baseline(
  db: Executor,
  options: { apply: boolean; migrationsFolder?: string },
): Promise<BaselineResult> {
  const [hasSchema] = await db.query(
    `select to_regclass('public."User"') is not null as present`,
  );
  if (!hasSchema?.present) return { status: "empty-database" };

  const [tracked] = await db.query(
    `select to_regclass('drizzle.__drizzle_migrations') is not null as present`,
  );
  if (tracked?.present) {
    const [{ n }] = await db.query(
      `select count(*)::int as n from drizzle.__drizzle_migrations`,
    );
    if (Number(n) > 0) {
      return { status: "already-baselined", rows: Number(n) };
    }
  }

  // The live schema must be exactly what 0000_baseline builds.
  const reference = await databaseFromMigrations(1, options.migrationsFolder);
  try {
    const differences = diff(
      await describe(pgliteQuery(reference)),
      await describe(db.query),
    );
    if (differences.length > 0) {
      return { status: "schema-mismatch", differences };
    }
  } finally {
    await reference.close();
  }

  const [first] = migrations(options.migrationsFolder);
  const stamp = { hash: first.hash, createdAt: first.folderMillis };
  if (!options.apply) return { status: "ready", ...stamp };

  // Same DDL and row as drizzle-orm's migrator (pg-core dialect.migrate).
  await db.transaction([
    `CREATE SCHEMA IF NOT EXISTS "drizzle"`,
    `CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
       id SERIAL PRIMARY KEY,
       hash text NOT NULL,
       created_at bigint
     )`,
    `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
     VALUES (${quote(stamp.hash)}, ${stamp.createdAt})`,
  ]);
  return { status: "baselined", ...stamp };
}
