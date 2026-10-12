/**
 * Production seed CLI: `npm run db:seed`.
 *
 * Writes to the database in DATABASE_URL (from the environment or .env.local).
 */
import { existsSync } from "node:fs";

async function main() {
  if (!process.env.DATABASE_URL && existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  // Imported after the env is loaded: the client reads DATABASE_URL on import.
  const { db } = await import("../index");
  const { runSeed } = await import("./run");
  await runSeed(db);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
