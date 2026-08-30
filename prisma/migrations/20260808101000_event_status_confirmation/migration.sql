-- CreateEnum
CREATE TYPE "EventStatusConfirmationState" AS ENUM ('NOT_REQUIRED', 'NEEDS_STATUS_CONFIRMATION', 'CONFIRMED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "status_confirmation_state" "EventStatusConfirmationState" NOT NULL DEFAULT 'NOT_REQUIRED';

-- Mark past planned events that are not already completed or cancelled for manual status review.
UPDATE "events"
SET "status_confirmation_state" = 'NEEDS_STATUS_CONFIRMATION'
WHERE "deleted_at" IS NULL
  AND "end_date" < CURRENT_TIMESTAMP
  AND "status" NOT IN ('COMPLETED', 'CANCELLED');