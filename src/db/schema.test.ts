// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  is,
  One,
} from "drizzle-orm";
import * as schema from "./schema";
import * as relations from "./relations";

// Guards src/db/schema.ts against drifting from the committed migrations in
// drizzle/ (run `npm run db:generate` after changing the schema), and keeps the
// client-side defaults the database itself doesn't know about. Everything runs
// on in-memory Postgres; no real database is touched.

const tables = (Object.values(schema) as unknown[])
  .filter((v): v is PgTable => is(v, PgTable))
  .map((t) => getTableConfig(t));

const CATALOG: Record<string, string> = {
  columns: `select table_name, column_name, data_type, udt_name, is_nullable,
                   coalesce(column_default, '') as column_default
            from information_schema.columns where table_schema = 'public' order by 1, 2`,
  enums: `select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels
          from pg_type t join pg_enum e on e.enumtypid = t.oid group by 1 order by 1`,
  indexes: `select tablename, indexname, regexp_replace(indexdef, '\\s+', ' ', 'g') as def
            from pg_indexes where schemaname = 'public' order by 1, 2`,
  constraints: `select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def
                from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`,
};

async function catalog(db: PGlite) {
  const result: Record<string, unknown[]> = {};
  for (const [name, query] of Object.entries(CATALOG)) {
    result[name] = (await db.query(query)).rows;
  }
  return result;
}

async function fromMigrations() {
  const dir = join(process.cwd(), "drizzle");
  const journal = JSON.parse(
    readFileSync(join(dir, "meta", "_journal.json"), "utf8"),
  ) as {
    entries: { tag: string }[];
  };
  const db = new PGlite();
  for (const { tag } of journal.entries) {
    const migration = readFileSync(join(dir, `${tag}.sql`), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) await db.exec(statement);
    }
  }
  return db;
}

async function fromSchema() {
  const { generateDrizzleJson, generateMigration } =
    await import("drizzle-kit/api");
  const ddl = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(schema),
  );
  const db = new PGlite();
  for (const statement of ddl) await db.exec(statement);
  return db;
}

describe("drizzle/ migrations", () => {
  test("build exactly the database schema.ts describes", async () => {
    const [migrated, declared] = await Promise.all([
      fromMigrations(),
      fromSchema(),
    ]);
    try {
      expect(await catalog(migrated)).toEqual(await catalog(declared));
    } finally {
      await Promise.all([migrated.close(), declared.close()]);
    }
  }, 120_000);
});

describe("schema.ts client-side defaults", () => {
  describe.each(tables.map((t) => [t.name, t] as const))(
    "%s",
    (_name, table) => {
      test("generates a cuid for a text primary key `id`", () => {
        const id = table.columns.find((c) => c.name === "id");
        // User ids are Clerk user ids, supplied by the caller.
        if (
          !id ||
          !id.primary ||
          id.columnType !== "PgText" ||
          table.name === "User"
        )
          return;
        expect(id.defaultFn).toBeTypeOf("function");
        expect(id.defaultFn!()).toMatch(/^[a-z0-9]{24,}$/);
      });

      test("sets `updatedAt` on insert and update", () => {
        const updatedAt = table.columns.find((c) => c.name === "updatedAt");
        if (!updatedAt) return;
        expect(updatedAt.defaultFn).toBeTypeOf("function");
        expect(updatedAt.onUpdateFn).toBeTypeOf("function");
      });

      test("defaults every list column to an empty list", () => {
        for (const col of table.columns.filter(
          (c) => c.columnType === "PgArray",
        )) {
          expect(col.hasDefault, col.name).toBe(true);
        }
      });

      test("returns timestamps as Date objects", () => {
        for (const col of table.columns.filter(
          (c) => c.columnType === "PgTimestamp",
        )) {
          expect(col.dataType, col.name).toBe("date");
        }
      });
    },
  );

  test("declares a relation for every foreign key", () => {
    const { tables: config } = extractTablesRelationalConfig(
      { ...schema, ...relations },
      createTableRelationsHelpers,
    );
    const byName = new Map(Object.values(config).map((t) => [t.dbName, t]));

    for (const table of tables) {
      const declared = Object.values(byName.get(table.name)?.relations ?? {});
      for (const fk of table.foreignKeys) {
        const ref = fk.reference();
        const target = getTableConfig(ref.foreignTable).name;
        const covered = declared.some(
          (r) =>
            is(r, One) &&
            getTableConfig(r.referencedTable).name === target &&
            (r.config?.fields ?? []).some((f) =>
              ref.columns.some((c) => c.name === f.name),
            ),
        );
        expect(covered, `${table.name} → ${target}`).toBe(true);
      }
    }
  });
});
