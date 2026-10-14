import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next's env files; load the local one if present.
if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// `generate` and `check` work offline; only `migrate`, `pull` and `studio`
// connect, and they fail with a clear error if DATABASE_URL is unset.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  // Left over from Prisma in databases created before the switch; not ours.
  tablesFilter: ["!_prisma_migrations"],
});
