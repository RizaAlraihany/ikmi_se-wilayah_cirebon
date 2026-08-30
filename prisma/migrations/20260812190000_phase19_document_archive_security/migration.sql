-- Phase 19: dedicated document authorization, download audit, and file metadata.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOWNLOAD';

ALTER TABLE "document_archives"
  ADD COLUMN IF NOT EXISTS "file_name" TEXT,
  ADD COLUMN IF NOT EXISTS "file_mime_type" TEXT,
  ADD COLUMN IF NOT EXISTS "file_size" INTEGER;

INSERT INTO "permissions" ("id", "name", "module", "created_at", "updated_at")
VALUES
  ('document_archive.view', 'View Document Archives', 'Documents', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('document_archive.manage', 'Manage Document Archives', 'Documents', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "module" = EXCLUDED."module",
  "deleted_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at", "updated_at")
SELECT
  'admin_organization',
  permission_id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (VALUES ('document_archive.view'), ('document_archive.manage')) AS grants(permission_id)
WHERE EXISTS (
  SELECT 1 FROM "roles" WHERE "id" = 'admin_organization' AND "deleted_at" IS NULL
)
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET
  "deleted_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP;
