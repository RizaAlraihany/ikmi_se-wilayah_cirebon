-- Phase 18: preserve gallery history and support activity-date filtering.
ALTER TABLE "albums"
  ADD COLUMN IF NOT EXISTS "cover_public_id" TEXT,
  ADD COLUMN IF NOT EXISTS "event_date" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "albums_is_public_deleted_at_event_date_idx"
  ON "albums"("is_public", "deleted_at", "event_date");
