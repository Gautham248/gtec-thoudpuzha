// Vitest globalSetup: build the PGlite empty-schema snapshot once, before any
// test worker starts, so test files only restore it (see ./pg-test-db.ts).
import { ensureSnapshot } from "./pg-test-db";

export default async function setup() {
  await ensureSnapshot();
}
