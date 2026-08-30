-- Phase 2: align dashboard roles with the final PRD and add explicit JWT
-- revocation support. This is an expand-and-migrate change: legacy roles are
-- retained as soft-deleted records for auditability, never hard-deleted.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "users"
  ALTER COLUMN "role_id" DROP NOT NULL;

INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
VALUES (
  'admin_organization',
  'Admin Organisasi',
  'Mengelola data operasional organisasi sesuai permission yang diberikan.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "deleted_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP;

-- Preserve the effective operational access of legacy Secretary and Treasurer
-- accounts while consolidating them into the single PRD Admin Organization
-- role. Program/member/organization permissions are explicitly added because
-- they were previously held only by Super Admin in the legacy seed.
INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at", "updated_at")
SELECT 'admin_organization', "permission_id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "role_permissions"
WHERE "role_id" IN ('admin_sekretaris', 'admin_bendahara')
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "deleted_at" = NULL, "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at", "updated_at")
SELECT 'admin_organization', "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "id" IN (
  'program.view',
  'program.create',
  'program.update',
  'program.delete',
  'member.view',
  'member.create',
  'member.update',
  'member.verify',
  'member.promote',
  'organization.view',
  'organization.update'
)
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "deleted_at" = NULL, "updated_at" = CURRENT_TIMESTAMP;

UPDATE "users"
SET
  "role_id" = 'admin_organization',
  "session_version" = "session_version" + 1,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "role_id" IN ('admin_sekretaris', 'admin_bendahara');

-- Members/pengurus without dashboard responsibility no longer carry a
-- permanent member role. They cannot authenticate to the dashboard.
UPDATE "users"
SET
  "role_id" = NULL,
  "session_version" = "session_version" + 1,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "role_id" = 'user';

UPDATE "roles"
SET "deleted_at" = COALESCE("deleted_at", CURRENT_TIMESTAMP), "updated_at" = CURRENT_TIMESTAMP
WHERE "id" IN ('admin_sekretaris', 'admin_bendahara', 'user');
