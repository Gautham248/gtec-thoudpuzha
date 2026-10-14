// A real Postgres for tests, in memory (PGlite), built from src/db/schema.ts.
//
// Use it when a test needs genuine write semantics — inserts with defaults,
// upserts, bulk updates, `updatedAt` hooks — that the drizzle-mock fake can't
// model. Each call is a fresh, empty database; nothing touches a real server.
//
//   // @vitest-environment node
//   vi.mock("@/db", async () => ({ db: await (await import("@/__tests__/pg-test-db")).createTestDb() }));
//   import { db } from "@/db";
//   beforeEach(() => truncateAll(db));
//
// Booting PGlite from scratch (initdb) and generating the schema's DDL with
// drizzle-kit are slow (seconds each), so the empty schema is built once and
// saved as a data-directory snapshot in the OS temp dir, keyed by a hash of
// schema.ts. Every test database starts from that snapshot. The vitest
// globalSetup (./pg-global-setup.ts) builds it before any worker starts.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { is, sql } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as tables from "@/db/schema";
import * as relations from "@/db/relations";

const schema = { ...tables, ...relations };

/** Snapshot file for the current schema.ts (and PGlite build). */
export function snapshotPath(): string {
  const schemaSource = readFileSync(
    join(process.cwd(), "src", "db", "schema.ts"),
  );
  const pglite = readFileSync(
    join(
      process.cwd(),
      "node_modules",
      "@electric-sql",
      "pglite",
      "package.json",
    ),
  );
  const hash = createHash("sha256")
    .update(schemaSource)
    .update(pglite)
    .digest("hex");
  return join(tmpdir(), `gtec-pglite-schema-${hash.slice(0, 16)}.tar.gz`);
}

/** Build the empty-schema snapshot if it isn't on disk yet; returns its path. */
export async function ensureSnapshot(): Promise<string> {
  const file = snapshotPath();
  if (existsSync(file)) return file;

  const { generateDrizzleJson, generateMigration } =
    await import("drizzle-kit/api");
  const ddl = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(tables),
  );
  const client = new PGlite();
  for (const statement of ddl) {
    await client.exec(statement);
  }
  const dump = await client.dumpDataDir("gzip");
  await client.close();

  // Write then rename, so a concurrent reader never sees a partial file.
  const partial = `${file}.${process.pid}.partial`;
  writeFileSync(partial, Buffer.from(await dump.arrayBuffer()));
  renameSync(partial, file);
  return file;
}

export async function createTestDb() {
  const file = await ensureSnapshot();
  const client = new PGlite({ loadDataDir: new Blob([readFileSync(file)]) });
  return drizzle({ client, schema });
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

/** Empty every table (keeps the schema), for use in beforeEach. */
export async function truncateAll(db: unknown) {
  const names = Object.values(tables).flatMap((t) =>
    is(t, PgTable) ? [`"${getTableConfig(t).name}"`] : [],
  );
  await (db as TestDb).execute(sql.raw(`TRUNCATE ${names.join(", ")} CASCADE`));
}
