-- Phase 3: Admin Organization must be able to manage the organization
-- structure exposed by its role-scoped workspace navigation.
INSERT INTO "permissions" (
  "id",
  "name",
  "module",
  "created_at",
  "updated_at"
)
VALUES (
  'structure.manage',
  'Manage Organization Structure',
  'Organization',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "module" = EXCLUDED."module",
  "deleted_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" (
  "role_id",
  "permission_id",
  "created_at",
  "updated_at"
)
SELECT
  'admin_organization',
  'structure.manage',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM "roles" WHERE "id" = 'admin_organization' AND "deleted_at" IS NULL
)
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET
  "deleted_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP;
