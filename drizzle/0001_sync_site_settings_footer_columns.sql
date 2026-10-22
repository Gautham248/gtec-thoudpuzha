-- Bring databases created by Prisma before its last migration
-- (20260729000000_add_footer_settings_fields) up to 0000_baseline: production
-- never got those two SiteSettings columns. Safe to run anywhere: databases
-- built from 0000_baseline already have them, so IF NOT EXISTS makes this a no-op.
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "mapsUrl" text;--> statement-breakpoint
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "whatsappNumber" text;
