# Test Database Configuration

## Setup

Tests never connect to a real database. Database tests run against PGlite, an
in-memory Postgres, built from `src/db/schema.ts` (see
`src/__tests__/pg-test-db.ts`). The empty schema is built once per schema
version and cached in the OS temp directory, so each test database starts in
milliseconds. Tests that only need canned query results use the in-memory
fake in `src/__tests__/drizzle-mock.ts`, which `src/__tests__/setup.ts`
installs for `@/db` by default.

`src/db/schema.test.ts` also checks that the SQL migrations in `drizzle/` build
exactly the schema `src/db/schema.ts` describes.

## CI Strategy

CI starts a throwaway PostgreSQL service and runs `npm run db:migrate` against
it before linting, testing and building (see `.github/workflows/ci.yml`).

## Seed verification (opt-in)

`src/__tests__/seed-verification.test.ts` can run read-only checks against a
seeded database:

```bash
SEED_VERIFICATION=true DATABASE_URL=<database-url> npm test -- seed-verification
```
