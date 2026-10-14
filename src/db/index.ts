import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as tables from "./schema";
import * as relations from "./relations";

export const schema = { ...tables, ...relations };

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Same driver split as src/lib/db.ts: Neon's pooled driver in the cloud,
  // a plain pg pool for local/Docker Postgres. Both support transactions.
  if (databaseUrl.includes("neon.tech")) {
    return drizzleNeon({
      client: new NeonPool({ connectionString: databaseUrl }),
      schema,
    });
  }
  return drizzlePg({
    client: new pg.Pool({ connectionString: databaseUrl }),
    schema,
  });
}

export type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db?: Database };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
