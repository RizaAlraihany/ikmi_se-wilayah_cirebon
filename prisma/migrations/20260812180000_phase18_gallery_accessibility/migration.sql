-- Phase 18: stable public gallery URLs and per-photo accessibility metadata.
ALTER TABLE "albums" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "albums"
SET "slug" = CONCAT(
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'album'
  ),
  '-',
  LEFT(MD5("id"), 8)
)
WHERE "slug" IS NULL;

ALTER TABLE "albums" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "albums_slug_key" ON "albums"("slug");

ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "alt_text" TEXT;
