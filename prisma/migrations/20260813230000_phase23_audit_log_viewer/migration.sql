ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AUTHORIZATION_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STATUS_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROLE_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SECURITY_SETTING_CHANGE';

ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL;

-- Remove unsafe historical payloads as a whole. New writes and the viewer use
-- recursive field-level redaction, but old free-form JSON cannot be trusted.
UPDATE "audit_logs"
SET "old_data" = '{"redacted":"[HISTORICAL_SENSITIVE_DATA_REMOVED]"}'
WHERE "old_data" ~* '(password|passcode|secret|token|authorization|cookie|session|private.?key|filePublicId|documentPublicId|attachmentPublicId|revisionTokenHash)';

UPDATE "audit_logs"
SET "new_data" = '{"redacted":"[HISTORICAL_SENSITIVE_DATA_REMOVED]"}'
WHERE "new_data" ~* '(password|passcode|secret|token|authorization|cookie|session|private.?key|filePublicId|documentPublicId|attachmentPublicId|revisionTokenHash)';

CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx"
  ON "audit_logs"("action", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
  ON "audit_logs"("created_at" DESC);
