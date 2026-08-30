-- Phase 4 safe backfill. Unknown legacy visibility must never become public,
-- and unverified legacy Program rows remain explicitly marked for review.
UPDATE "programs"
SET
  "visibility" = 'HIDDEN'::"Visibility",
  "updated_at" = CURRENT_TIMESTAMP
WHERE "visibility" IS NULL;

UPDATE "programs"
SET
  "verification_status" = 'NEEDS_VERIFICATION'::"VerificationStatus",
  "updated_at" = CURRENT_TIMESTAMP
WHERE "verification_status" IS NULL;

ALTER TABLE "programs"
  ALTER COLUMN "visibility" SET DEFAULT 'HIDDEN'::"Visibility",
  ALTER COLUMN "visibility" SET NOT NULL,
  ALTER COLUMN "verification_status" SET DEFAULT 'NEEDS_VERIFICATION'::"VerificationStatus",
  ALTER COLUMN "verification_status" SET NOT NULL;

-- Legacy program_type, requires_committee, Activity, and the empty committee
-- tables stay physically preserved until the verified backup/contract phase.
-- They are intentionally absent from the active Prisma domain.
