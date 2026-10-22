# GTEC Thodupuzha

Multi-tenant web platform for GTEC Thodupuzha: a public marketing site, student portal, job portal, and admin system.

Built with [Next.js](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, and shadcn/ui.

## Prerequisites

- Node.js >= 20.9 (see `.nvmrc`)
- npm

## Quick Start (1-Command Docker Setup)

Any developer can clone the repository and launch the full environment (PostgreSQL + Next.js + Seeded Database) with **a single Docker command** without needing shared production `.env` credentials:

```bash
docker compose up
# Or: npm run dev:docker
```

This will automatically:
1. Start a local PostgreSQL container (`localhost:5432`).
2. Create the database schema from the Drizzle migrations in `drizzle/` (only when the database is empty).
3. Seed the new database with sample courses, news, students, job postings, and site settings.
4. Launch the Next.js development server at [http://localhost:3000](http://localhost:3000) with hot-reloading enabled.

---

## 🪟 Windows Developer Setup

Developing on Windows? Check out the dedicated **[Windows Developer Guide & Instruction Manual](file:///Users/gauthamkrishna/Code/leedsdigital/gtec-thoudpuzha/docs/WINDOWS_DEVELOPMENT_GUIDE.md)** (`docs/WINDOWS_DEVELOPMENT_GUIDE.md`) for WSL 2 recommendations, PowerShell commands, and troubleshooting tips.

---

## Manual Setup (Without Docker)

If you prefer running Node.js directly on your machine:

```bash
cp .env.example .env.local
npm install
npm run db:migrate   # new, empty database (existing one: see below)
npm run db:seed
npm run dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Write a new SQL migration in `drizzle/` after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations in `drizzle/` to `DATABASE_URL` |
| `npm run db:baseline` | One-time adoption of `drizzle/` by a database created before the Prisma → Drizzle switch (dry run; add `-- --apply`) |
| `npm run db:seed` | Seed `DATABASE_URL` with sample data (idempotent) |
| `npm run db:studio` | Browse the database with Drizzle Studio |

## Existing databases (created by Prisma)

Databases created before the switch to Drizzle (production, older local
volumes) already have every table, but no record of `drizzle/0000_baseline.sql`.
Run this **once per database** before its first `npm run db:migrate`:

```bash
# 1. Back up the database first.
# 2. Dry run: checks the live schema matches 0000_baseline exactly. Writes nothing.
DATABASE_URL=<that database> npm run db:baseline
# 3. Record 0000_baseline as already applied.
DATABASE_URL=<that database> npm run db:baseline -- --apply
# 4. From now on, schema changes go through migrations as usual.
DATABASE_URL=<that database> npm run db:migrate
```

`--apply` only creates `drizzle.__drizzle_migrations` (Drizzle's bookkeeping
table, in its own `drizzle` schema) and inserts one row. It never touches app
tables. If the live schema differs from the baseline in any way, it lists the
differences and writes nothing. Running it again on a baselined database does
nothing. Run it from a dev checkout (`npm install` with dev dependencies).

**If the dry run reports missing columns:** the database stopped short of
Prisma's last migration. Production is missing `SiteSettings.mapsUrl` and
`whatsappNumber`; its schema is kept in `docs/production-schema.prisma`. Run
the SQL in `drizzle/0001_sync_site_settings_footer_columns.sql` against that
database (it only adds the two columns, if missing), then repeat steps 2–4.
`db:migrate` then records 0001 as applied.

**Rollback:** `DROP SCHEMA drizzle CASCADE;` removes only that bookkeeping
table; app tables and Prisma's old `_prisma_migrations` history are untouched.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

See `.env.example` for the full list of required variables. Up-to-date descriptions of each variable are maintained in `AGENTS.md`.

## Project Structure

```
src/
├── app/
│   ├── (public)/      # Public marketing site routes
│   ├── (portal)/      # Student & Employer portal routes (auth required)
│   └── (admin)/       # Admin routes (Super Admin & Centre Staff)
├── components/
│   └── ui/            # shadcn/ui components
├── db/                # Drizzle schema, relations, client and seed
├── server/
│   ├── trpc.ts        # tRPC procedure builders (role / permission checks)
│   ├── form.ts        # zod helpers that parse <form> FormData
│   ├── action.ts      # api() caller + run() used by Server Actions
│   └── routers/       # admin.*, portal.*, public.* procedures (all mutation logic)
├── lib/
│   └── utils.ts       # shadcn/ui utility
└── __tests__/         # Vitest smoke tests
```

Each `actions.ts` Server Action is a thin wrapper: pages post plain `<form>`s
to it, and it calls the matching tRPC procedure through `api()`. Put new
mutation logic in a router under `src/server/routers/`, not in the action.

## Deployment

Connected to Vercel — pushes to `main` deploy automatically. Preview deployments are created on PRs.

## License

Private — GTEC Thodupuzha.
