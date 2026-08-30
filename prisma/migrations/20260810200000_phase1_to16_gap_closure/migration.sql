-- Add the explicit manual Agenda override required by the final domain.
-- This is additive and leaves all existing Agenda records unchanged.
ALTER TYPE "AgendaStatus" ADD VALUE IF NOT EXISTS 'POSTPONED';

-- Homepage campaigns can be paused without losing their schedule or content.
ALTER TYPE "HomepageBannerStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- A request can create at most one Content Plan. The partial index preserves
-- normal nullable records while enforcing conversion idempotency.
CREATE UNIQUE INDEX IF NOT EXISTS "content_plans_pamflet_request_id_key"
  ON "content_plans"("pamflet_request_id")
  WHERE "pamflet_request_id" IS NOT NULL;

ALTER TABLE "pamflet_requests"
  ADD COLUMN IF NOT EXISTS "attachment_public_id" TEXT;

ALTER TYPE "KaryaTulisStatus" ADD VALUE IF NOT EXISTS 'REVISION_REQUIRED';
ALTER TYPE "KaryaTulisStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "karya_tulis"
  ADD COLUMN IF NOT EXISTS "revision_token_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "revision_token_expires_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "karya_tulis_revision_token_hash_key"
  ON "karya_tulis"("revision_token_hash")
  WHERE "revision_token_hash" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "karya_tulis_versions" (
  "id" TEXT NOT NULL,
  "karya_tulis_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "original_filename" TEXT NOT NULL,
  "file_public_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploaded_by" TEXT,
  CONSTRAINT "karya_tulis_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "karya_tulis_versions_karya_tulis_id_fkey" FOREIGN KEY ("karya_tulis_id") REFERENCES "karya_tulis"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "karya_tulis_versions_karya_tulis_id_version_number_key"
  ON "karya_tulis_versions"("karya_tulis_id", "version_number");
CREATE INDEX IF NOT EXISTS "karya_tulis_versions_karya_tulis_id_idx"
  ON "karya_tulis_versions"("karya_tulis_id");

ALTER TABLE "members"
  ADD COLUMN IF NOT EXISTS "registration_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "members_registration_id_key"
  ON "members"("registration_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_registration_id_fkey') THEN
    ALTER TABLE "members" ADD CONSTRAINT "members_registration_id_fkey"
      FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
