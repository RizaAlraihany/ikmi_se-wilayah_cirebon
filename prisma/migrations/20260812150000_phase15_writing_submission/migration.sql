-- Preserve legacy records while aligning status names with the approved workflow.
ALTER TYPE "KaryaTulisStatus" RENAME VALUE 'PENDING' TO 'SUBMITTED';
ALTER TYPE "KaryaTulisStatus" RENAME VALUE 'REVISION' TO 'RESUBMITTED';
ALTER TYPE "KaryaTulisStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "KaryaTulisStatus" ADD VALUE IF NOT EXISTS 'ARTICLE_DRAFT_CREATED';
ALTER TYPE "KaryaTulisStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "KaryaTulisStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "karya_tulis"
  ADD COLUMN IF NOT EXISTS "submission_number" TEXT,
  ADD COLUMN IF NOT EXISTS "author_unit" TEXT,
  ADD COLUMN IF NOT EXISTS "consent_at" TIMESTAMP(3);

UPDATE "karya_tulis"
SET "submission_number" = 'IKMI-KT-LEGACY-' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 10))
WHERE "submission_number" IS NULL;

ALTER TABLE "karya_tulis" ALTER COLUMN "submission_number" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "karya_tulis_submission_number_key" ON "karya_tulis"("submission_number");

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "writing_submission_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "posts_writing_submission_id_key" ON "posts"("writing_submission_id");
ALTER TABLE "posts" ADD CONSTRAINT "posts_writing_submission_id_fkey"
  FOREIGN KEY ("writing_submission_id") REFERENCES "karya_tulis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
