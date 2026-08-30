-- Phase 4: one Program entity with derived status and optional campaign.
-- Legacy program_type, committee tables, Activity, and historical status rows are
-- deliberately retained for audit/backward compatibility but are no longer used
-- by the active Program workflow.

DO $$
BEGIN
  CREATE TYPE "ProgramStatusOverride" AS ENUM ('POSTPONED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "Visibility" ADD VALUE IF NOT EXISTS 'INTERNAL';

ALTER TABLE "programs"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "status_override" "ProgramStatusOverride",
  ADD COLUMN IF NOT EXISTS "campaign_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "programs"
SET "slug" = CONCAT(
  COALESCE(
    NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')),
    ''
  ),
  'program'
  ),
  '-',
  RIGHT("id", 6)
)
WHERE "slug" IS NULL;

UPDATE "programs"
SET "featured" = COALESCE("is_featured", false)
WHERE "featured" = false AND "is_featured" IS NOT NULL;

UPDATE "programs"
SET "status_override" = CASE
  WHEN "status"::text = 'POSTPONED' THEN 'POSTPONED'::"ProgramStatusOverride"
  WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'::"ProgramStatusOverride"
  ELSE NULL
END
WHERE "status"::text IN ('POSTPONED', 'CANCELLED');

CREATE UNIQUE INDEX IF NOT EXISTS "programs_slug_key" ON "programs"("slug");
