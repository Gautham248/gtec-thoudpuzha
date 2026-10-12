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

if [ "$HAS_SCHEMA" = "t" ]; then
  # An existing database (possibly created by Prisma) is left exactly as it is.
  echo "ℹ️ Database already has the schema; skipping migrations and seed."
else
  echo "🚀 Creating the database schema (drizzle-kit migrate)..."
  npm run db:migrate

  echo "🌱 Seeding initial database records..."
  npm run db:seed || echo "⚠️ Seeding finished with warnings."
fi

echo "🎉 Environment ready! Starting Next.js dev server on http://localhost:3000..."
exec npm run dev
