#!/bin/bash
set -e

echo "=== G-TEC Local Development Entrypoint ==="

# Copy .env.example to .env.local if not present
if [ ! -f .env.local ] && [ ! -f .env ]; then
  echo "📄 Creating .env.local from .env.example..."
  cp .env.example .env.local
fi

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

echo "⏳ Waiting for PostgreSQL container ($DB_HOST:$DB_PORT) to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 1
done

echo "✅ PostgreSQL is ready!"

# psql rejects Prisma-style query params such as ?schema=public.
PSQL_URL="${DATABASE_URL%%\?*}"
HAS_SCHEMA=$(psql "$PSQL_URL" -tAc "select to_regclass('public.\"User\"') is not null")
HAS_DRIZZLE=$(psql "$PSQL_URL" -tAc "select to_regclass('drizzle.__drizzle_migrations') is not null")

if [ "$HAS_SCHEMA" = "t" ] && [ "$HAS_DRIZZLE" != "t" ]; then
  # Created by Prisma and never adopted by Drizzle: migrating would try to
  # recreate existing tables, so leave it exactly as it is.
  echo "ℹ️ Database predates Drizzle; skipping migrations and seed."
  echo "   Adopt it once with: npm run db:baseline (see README)."
else
  # Fresh, or already managed by Drizzle. Migrating is idempotent, so new
  # migrations on a kept pgdata volume are applied rather than skipped.
  echo "🚀 Applying database migrations (drizzle-kit migrate)..."
  npm run db:migrate

  if [ "$HAS_SCHEMA" != "t" ]; then
    echo "🌱 Seeding initial database records..."
    npm run db:seed || echo "⚠️ Seeding finished with warnings."
  fi
fi

echo "🎉 Environment ready! Starting Next.js dev server on http://localhost:3000..."
exec npm run dev
