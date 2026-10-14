// @vitest-environment node
// db:baseline on in-memory databases standing in for a Prisma-created one.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { baseline, type Executor } from "./baseline";
import {
  databaseFromMigrations,
  MIGRATIONS_FOLDER,
  migrations,
} from "./catalog";

const open: PGlite[] = [];
afterEach(async () => {
  await Promise.all(open.splice(0).map((db) => db.close()));
});

/** A database with the app schema and Prisma's history table, like production. */
async function prismaCreatedDatabase() {
  const db = await databaseFromMigrations(1);
  await db.exec(
    `CREATE TABLE "_prisma_migrations" (id varchar(36) PRIMARY KEY, checksum varchar(64) NOT NULL)`,
  );
  open.push(db);
  return db;
}

function executor(db: PGlite): Executor {
  return {
    query: async (sql) => (await db.query<Record<string, unknown>>(sql)).rows,
    transaction: (statements) =>
      db.transaction(async (tx) => {
        for (const statement of statements) await tx.exec(statement);
      }),
  };
}

const trackingTable = async (db: PGlite) =>
  (
    await db.query<{ present: boolean }>(
      `select to_regclass('drizzle.__drizzle_migrations') is not null as present`,
    )
  ).rows[0].present;

const [baselineMigration] = migrations();

describe("baseline", () => {
  test("a dry run checks the schema and writes nothing", async () => {
    const db = await prismaCreatedDatabase();

    const result = await baseline(executor(db), { apply: false });

    expect(result).toEqual({
      status: "ready",
      hash: baselineMigration.hash,
      createdAt: baselineMigration.folderMillis,
    });
    expect(await trackingTable(db)).toBe(false);
  }, 60_000);

  test("--apply records 0000_baseline exactly as Drizzle's migrator would", async () => {
    const db = await prismaCreatedDatabase();

    expect(await baseline(executor(db), { apply: true })).toMatchObject({
      status: "baselined",
    });

    const rows = (
      await db.query(
        `select hash, created_at::text as created_at from drizzle.__drizzle_migrations`,
      )
    ).rows;
    expect(rows).toEqual([
      {
        hash: baselineMigration.hash,
        created_at: String(baselineMigration.folderMillis),
      },
    ]);
  }, 60_000);

  test("after baselining, db:migrate applies only newer migrations", async () => {
    const db = await prismaCreatedDatabase();
    await baseline(executor(db), { apply: true });

    // drizzle/ plus one future migration.
    const folder = mkdtempSync(join(tmpdir(), "gtec-migrations-"));
    cpSync(MIGRATIONS_FOLDER, folder, { recursive: true });
    writeFileSync(
      join(folder, "0001_future.sql"),
      `ALTER TABLE "SiteSettings" ADD COLUMN "futureColumn" text;`,
    );
    const journalPath = join(folder, "meta", "_journal.json");
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    journal.entries.push({
      idx: 1,
      version: "7",
      when: baselineMigration.folderMillis + 1000,
      tag: "0001_future",
      breakpoints: true,
    });
    writeFileSync(journalPath, JSON.stringify(journal));

    // Without the baseline row this would fail on CREATE TYPE ... already exists.
    await migrate(drizzle({ client: db }), { migrationsFolder: folder });

    const column = await db.query(
      `select 1 from information_schema.columns
       where table_name = 'SiteSettings' and column_name = 'futureColumn'`,
    );
    expect(column.rows).toHaveLength(1);
    const tracked = await db.query(
      `select count(*)::int as n from drizzle.__drizzle_migrations`,
    );
    expect(tracked.rows).toEqual([{ n: 2 }]);
  }, 60_000);

  test("refuses, writing nothing, when the live schema differs", async () => {
    const db = await prismaCreatedDatabase();
    await db.exec(`ALTER TABLE "SiteSettings" DROP COLUMN "countries"`);

    const result = await baseline(executor(db), { apply: true });

    expect(result.status).toBe("schema-mismatch");
    expect(result.status === "schema-mismatch" && result.differences).toEqual(
      expect.arrayContaining([expect.stringContaining('"countries"')]),
    );
    expect(await trackingTable(db)).toBe(false);
  }, 60_000);

  test("running it again changes nothing", async () => {
    const db = await prismaCreatedDatabase();
    await baseline(executor(db), { apply: true });

    expect(await baseline(executor(db), { apply: true })).toEqual({
      status: "already-baselined",
      rows: 1,
    });
    const tracked = await db.query(
      `select count(*)::int as n from drizzle.__drizzle_migrations`,
    );
    expect(tracked.rows).toEqual([{ n: 1 }]);
  }, 60_000);

  test("an empty database is sent to db:migrate instead", async () => {
    const db = new PGlite();
    open.push(db);

    expect(await baseline(executor(db), { apply: true })).toEqual({
      status: "empty-database",
    });
    expect(await trackingTable(db)).toBe(false);
  }, 60_000);
});
