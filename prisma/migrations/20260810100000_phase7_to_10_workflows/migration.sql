-- Phase 7–10: extend V2 workflows without removing any legacy data.
-- Existing ProgramStatus values are intentionally retained for legacy Program/Activity records.
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'PLANNING';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'COMMITTEE_FORMATION';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'PREPARATION';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'PRE_EVENT';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'EXECUTION';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'EVALUATION';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'LPJ';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'POSTPONED';
ALTER TYPE "ProgramStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "ProgramRelationshipType" ADD VALUE IF NOT EXISTS 'PART_OF';
ALTER TYPE "AgendaStatus" ADD VALUE IF NOT EXISTS 'UNSCHEDULED';

ALTER TABLE "programs"
  ADD COLUMN IF NOT EXISTS "actual_evidence_url" TEXT,
  ADD COLUMN IF NOT EXISTS "actual_note" TEXT;

-- PRD names Kepengurusan 2026–2027 as the active initial period. No dates,
-- cabinet, chairman, PIC, or other unverified facts are inferred here.
UPDATE "periods"
SET "status" = 'ACTIVE', "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'prd_period_2026_2027' AND "deleted_at" IS NULL;
