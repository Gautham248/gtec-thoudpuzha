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

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { is, sql } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as tables from "@/db/schema";
import * as relations from "@/db/relations";

const schema = { ...tables, ...relations };

let ddl: Promise<string[]> | undefined;

/** CREATE statements for the whole schema, computed once per test file. */
function schemaDdl(): Promise<string[]> {
  ddl ??= (async () => {
    const { generateDrizzleJson, generateMigration } =
      await import("drizzle-kit/api");
    return generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson(tables),
    );
  })();
  return ddl;
}

export async function createTestDb() {
  const client = new PGlite();
  for (const statement of await schemaDdl()) {
    await client.exec(statement);
  }
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
