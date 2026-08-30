-- CreateEnum
CREATE TYPE "EventScheduleState" AS ENUM ('UPCOMING', 'DUE', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "schedule_state" "EventScheduleState" NOT NULL DEFAULT 'UPCOMING';

-- CreateTable
CREATE TABLE "broadcast_deliveries" (
    "id" TEXT NOT NULL,
    "broadcast_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_deliveries_broadcast_key_key" ON "broadcast_deliveries"("broadcast_key");

-- CreateIndex
CREATE INDEX "broadcast_deliveries_status_idx" ON "broadcast_deliveries"("status");

-- CreateIndex
CREATE INDEX "broadcast_deliveries_channel_idx" ON "broadcast_deliveries"("channel");