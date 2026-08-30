-- Phase 17 keeps historical structure assignments instead of deleting them.
ALTER TABLE "structure_assignments"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

DROP INDEX IF EXISTS "structure_assignments_period_id_user_id_position_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "structure_assignments_active_period_position_key"
  ON "structure_assignments"("period_id", "position_id")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "structure_assignments_active_period_user_position_key"
  ON "structure_assignments"("period_id", "user_id", "position_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "structure_assignments_period_id_deleted_at_idx"
  ON "structure_assignments"("period_id", "deleted_at");
