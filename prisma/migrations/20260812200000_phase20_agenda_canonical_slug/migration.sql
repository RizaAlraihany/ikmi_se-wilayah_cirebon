-- Phase 20: stable, human-readable canonical URLs for public Agenda pages.
ALTER TABLE "agendas" ADD COLUMN IF NOT EXISTS "slug" TEXT;

WITH normalized AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')), ''),
      'agenda'
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')), ''),
        'agenda'
      )
      ORDER BY "created_at", "id"
    ) AS slug_sequence
  FROM "agendas"
  WHERE "slug" IS NULL
)
UPDATE "agendas" AS agenda
SET "slug" = CASE
  WHEN normalized.slug_sequence = 1 THEN normalized.base_slug
  ELSE CONCAT(normalized.base_slug, '-', normalized.slug_sequence)
END
FROM normalized
WHERE agenda."id" = normalized."id";

ALTER TABLE "agendas" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "agendas_slug_key" ON "agendas"("slug");
