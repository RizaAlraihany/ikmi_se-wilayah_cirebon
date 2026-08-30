-- Phase 6: the legacy Program budget must represent an unknown plan as NULL,
-- never as a fabricated zero value.
ALTER TABLE "programs" ALTER COLUMN "budget_plan" DROP NOT NULL;
