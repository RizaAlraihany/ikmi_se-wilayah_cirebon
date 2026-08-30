DO $$
BEGIN
  CREATE TYPE "WhatsappMessageStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Some legacy installations received this table through db push before the
-- migration history was normalized. CREATE IF NOT EXISTS keeps both fresh and
-- existing databases safe.
CREATE TABLE IF NOT EXISTS "whatsapp_message_logs" (
  "id" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "WhatsappMessageStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" TEXT NOT NULL,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "provider_message_id" TEXT,
  "sent_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "last_attempt_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_message_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "whatsapp_message_logs"
  ADD COLUMN IF NOT EXISTS "attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "provider_message_id" TEXT,
  ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_attempt_at" TIMESTAMP(3);

UPDATE "whatsapp_message_logs"
SET
  "attempt_count" = GREATEST(
    "attempt_count",
    CASE WHEN "status"::text = 'PENDING' THEN "retry_count" ELSE "retry_count" + 1 END
  ),
  "last_attempt_at" = COALESCE("last_attempt_at", "updated_at"),
  "sent_at" = CASE
    WHEN "status"::text = 'SUCCESS' THEN COALESCE("sent_at", "updated_at")
    ELSE "sent_at"
  END,
  "failed_at" = CASE
    WHEN "status"::text = 'FAILED' THEN COALESCE("failed_at", "updated_at")
    ELSE "failed_at"
  END;

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_message_logs_idempotency_key_key"
  ON "whatsapp_message_logs"("idempotency_key");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_status_idx"
  ON "whatsapp_message_logs"("status");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_created_at_idx"
  ON "whatsapp_message_logs"("created_at");
