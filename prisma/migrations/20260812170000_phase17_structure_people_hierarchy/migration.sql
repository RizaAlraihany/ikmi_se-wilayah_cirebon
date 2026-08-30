ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "photo_public_id" TEXT;

ALTER TABLE "structure_assignments"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "member_id" TEXT,
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "structure_assignments" ADD CONSTRAINT "structure_assignments_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "structure_assignments_member_id_idx" ON "structure_assignments"("member_id");

ALTER TABLE "structure_assignments" ADD CONSTRAINT "structure_assignments_person_check"
  CHECK (("user_id" IS NOT NULL AND "member_id" IS NULL) OR ("user_id" IS NULL AND "member_id" IS NOT NULL));
