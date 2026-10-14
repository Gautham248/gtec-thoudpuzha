// @vitest-environment node
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
import {
  databaseFromMigrations,
  describe as describeCatalog,
  pgliteQuery,
} from "./catalog";

// Guards src/db/schema.ts against drifting from the committed migrations in
// drizzle/ (run `npm run db:generate` after changing the schema), and keeps the
// client-side defaults the database itself doesn't know about. Everything runs
// on in-memory Postgres; no real database is touched.

const tables = (Object.values(schema) as unknown[])
  .filter((v): v is PgTable => is(v, PgTable))
  .map((t) => getTableConfig(t));

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
      databaseFromMigrations(),
      fromSchema(),
    ]);
    try {
      expect(await describeCatalog(pgliteQuery(migrated))).toEqual(
        await describeCatalog(pgliteQuery(declared)),
      );
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
