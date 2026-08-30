-- Phase 19: unknown legacy visibility is made private by default.
UPDATE "document_archives"
SET "visibility" = 'INTERNAL'
WHERE "visibility" IS NULL;

ALTER TABLE "document_archives"
  ALTER COLUMN "visibility" SET DEFAULT 'INTERNAL',
  ALTER COLUMN "visibility" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "document_archives_deleted_at_category_archived_at_idx"
  ON "document_archives"("deleted_at", "category", "archived_at");
