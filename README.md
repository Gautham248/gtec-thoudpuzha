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
npm run db:migrate   # only for a new, empty database
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
| `npm run db:seed` | Seed `DATABASE_URL` with sample data (idempotent) |
| `npm run db:studio` | Browse the database with Drizzle Studio |

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
├── lib/
│   └── utils.ts       # shadcn/ui utility
└── __tests__/         # Vitest smoke tests
```

## Deployment

Connected to Vercel — pushes to `main` deploy automatically. Preview deployments are created on PRs.

## License

Private — GTEC Thodupuzha.
