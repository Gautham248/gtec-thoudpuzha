/**
 * Describe a Postgres database's app schema (tables, columns, enums, indexes,
 * keys) as plain rows, so two databases can be compared exactly. Used by the
 * schema test and by `npm run db:baseline` to prove a live database already
 * matches drizzle/0000_baseline.sql before marking it as applied.
 *
 * Only the `public` schema is described, without Prisma's old
 * `_prisma_migrations` history table.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { readMigrationFiles } from "drizzle-orm/migrator";

export type Query = (sql: string) => Promise<Record<string, unknown>[]>;
export type Catalog = Record<string, unknown[]>;

const NOT_PRISMA = "'_prisma_migrations'";

const CATALOG: Record<string, string> = {
  columns: `select table_name, column_name, data_type, udt_name, is_nullable,
                   coalesce(column_default, '') as column_default
            from information_schema.columns
            where table_schema = 'public' and table_name <> ${NOT_PRISMA}
            order by 1, 2`,
  enums: `select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels
          from pg_type t
          join pg_enum e on e.enumtypid = t.oid
          join pg_namespace n on n.oid = t.typnamespace
          where n.nspname = 'public'
          group by 1 order by 1`,
  indexes: `select tablename, indexname, regexp_replace(indexdef, '\\s+', ' ', 'g') as def
            from pg_indexes
            where schemaname = 'public' and tablename <> ${NOT_PRISMA}
            order by 1, 2`,
  constraints: `select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def
                from pg_constraint
                where connamespace = 'public'::regnamespace
                  and conrelid::regclass::text not in (${NOT_PRISMA}, '"_prisma_migrations"')
                order by 1, 2`,
};

export async function describe(query: Query): Promise<Catalog> {
  const result: Catalog = {};
  for (const [name, sql] of Object.entries(CATALOG)) {
    result[name] = await query(sql);
  }
  return result;
}

/** Human-readable lines for every row that is in one catalog but not the other. */
export function diff(expected: Catalog, actual: Catalog): string[] {
  const lines: string[] = [];
  for (const name of Object.keys(CATALOG)) {
    const want = (expected[name] ?? []).map((r) => JSON.stringify(r));
    const have = (actual[name] ?? []).map((r) => JSON.stringify(r));
    for (const row of want.filter((r) => !have.includes(r))) {
      lines.push(`${name}: missing ${row}`);
    }
    for (const row of have.filter((r) => !want.includes(r))) {
      lines.push(`${name}: unexpected ${row}`);
    }
  }
  return lines;
}

export const MIGRATIONS_FOLDER = join(process.cwd(), "drizzle");

/** The migrations in drizzle/, in order, as Drizzle's migrator reads them. */
export function migrations(folder = MIGRATIONS_FOLDER) {
  return readMigrationFiles({ migrationsFolder: folder });
}

/**
 * An in-memory database built by running the first `count` migrations in
 * drizzle/ (all of them by default). Caller closes it.
 */
export async function databaseFromMigrations(
  count?: number,
  folder = MIGRATIONS_FOLDER,
): Promise<PGlite> {
  const db = new PGlite();
  const journal = JSON.parse(
    readFileSync(join(folder, "meta", "_journal.json"), "utf8"),
  ) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries.slice(0, count)) {
    const migration = readFileSync(join(folder, `${tag}.sql`), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) await db.exec(statement);
    }
  }
  return db;
}

export const pgliteQuery =
  (db: PGlite): Query =>
  async (sql) =>
    (await db.query<Record<string, unknown>>(sql)).rows;
