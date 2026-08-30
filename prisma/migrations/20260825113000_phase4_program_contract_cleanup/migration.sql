-- Contract the legacy Program/Committee schema after the Domain V2 migration.
-- This migration is intended for a clean target database. Existing legacy data
-- must be archived before applying it to a historical database.

DROP TABLE IF EXISTS "committee_members";
DROP TABLE IF EXISTS "committee_divisions";
DROP TABLE IF EXISTS "committees";

ALTER TABLE "programs"
  DROP COLUMN IF EXISTS "program_type",
  DROP COLUMN IF EXISTS "requires_committee";

DROP TYPE IF EXISTS "CommitteeMemberStatus";
DROP TYPE IF EXISTS "CommitteeStatus";
DROP TYPE IF EXISTS "ProgramType";

ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_fkey";
ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "structure_assignments" DROP CONSTRAINT IF EXISTS "structure_assignments_user_id_fkey";
ALTER TABLE "structure_assignments"
  ADD CONSTRAINT "structure_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "content_plans_pamflet_request_id_key"
  ON "content_plans"("pamflet_request_id")
  WHERE "pamflet_request_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "karya_tulis_revision_token_hash_key"
  ON "karya_tulis"("revision_token_hash")
  WHERE "revision_token_hash" IS NOT NULL;
