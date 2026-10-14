/**
 * `npm run db:baseline` — dry run: checks DATABASE_URL and reports.
 * `npm run db:baseline -- --apply` — also records 0000_baseline as applied.
 *
 * See src/db/baseline.ts and the "Existing databases" section of README.md.
 */
import { existsSync } from "node:fs";
import pg from "pg";
import { baseline, type BaselineResult } from "./baseline";

function target(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function report(result: BaselineResult): number {
  switch (result.status) {
    case "empty-database":
      console.log(
        "This database has no app schema yet. Use `npm run db:migrate` instead.",
      );
      return 1;
    case "already-baselined":
      console.log(
        `Already tracked by Drizzle (${result.rows} migration row(s)). Nothing to do; use \`npm run db:migrate\`.`,
      );
      return 0;
    case "schema-mismatch":
      console.log(
        "Refusing: the live schema differs from drizzle/0000_baseline.sql. Nothing was written.",
      );
      for (const line of result.differences) console.log(`  ${line}`);
      return 1;
    case "ready":
      console.log(
        "Schema matches drizzle/0000_baseline.sql.\n" +
          "Dry run only — nothing was written. Re-run with `-- --apply` to create\n" +
          "drizzle.__drizzle_migrations and record 0000_baseline as applied.",
      );
      return 0;
    case "baselined":
      console.log(
        "Done: 0000_baseline recorded as applied. Future migrations: `npm run db:migrate`.\n" +
          "Rollback: DROP SCHEMA drizzle CASCADE;",
      );
      return 0;
  }
}

async function main() {
  if (!process.env.DATABASE_URL && existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const apply = process.argv.includes("--apply");
  console.log(`Database: ${target(url)}  (${apply ? "APPLY" : "dry run"})`);

  const pool = new pg.Pool({ connectionString: url });
  try {
    const result = await baseline(
      {
        query: async (sql) => (await pool.query(sql)).rows,
        transaction: async (statements) => {
          const client = await pool.connect();
          try {
            await client.query("BEGIN");
            for (const statement of statements) await client.query(statement);
            await client.query("COMMIT");
          } catch (error) {
            await client.query("ROLLBACK");
            throw error;
          } finally {
            client.release();
          }
        },
      },
      { apply },
    );
    return report(result);
  } finally {
    await pool.end();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error("Baseline failed:", e);
    process.exit(1);
  });
