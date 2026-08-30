-- Phase 5: additive Domain V2 expansion.
-- Legacy Program, Activity, Event, Registration, and Department data is retained.
-- No planned date is copied to actual execution fields in this migration.

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationalUnitStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationalUnitType" AS ENUM ('BPH', 'SECRETARIAT', 'TREASURY', 'DEPARTMENT', 'DIVISION');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('PROKER_BESAR', 'PROKER_KECIL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('DRAFT_DATA', 'NEEDS_VERIFICATION', 'VERIFIED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'MEMBER_ONLY', 'PENGURUS_ONLY', 'BPH_ONLY', 'HIDDEN');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('GENERAL_REGISTRATION', 'MEMBERSHIP_RECRUITMENT', 'INTERNAL_REGISTRATION', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "ProgramRelationshipType" AS ENUM ('RELATED_TO', 'DEPENDS_ON', 'SCHEDULED_WITH');

-- CreateEnum
CREATE TYPE "AgendaScheduleType" AS ENUM ('FIXED_DATE', 'RECURRING', 'CONDITIONAL', 'RELATIVE_TO_PROGRAM', 'DEPENDENT_ON_PROGRAM');

-- CreateEnum
CREATE TYPE "AgendaStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommitteeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommitteeMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "HomepageBannerPhase" AS ENUM ('BEFORE', 'PRA', 'AFTER');

-- CreateEnum
CREATE TYPE "HomepageBannerStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('NEW', 'NEEDS_VERIFICATION', 'INCOMPLETE', 'CONTACTED', 'VERIFIED', 'PRABUMI_PARTICIPANT', 'PASSED', 'ACTIVE', 'INACTIVE', 'REJECTED', 'ALUMNI');

-- CreateTable
CREATE TABLE "periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cabinet_name" TEXT,
    "chairman_name" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "PeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "registration_number" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "campus" TEXT,
    "study_program" TEXT,
    "entry_year" INTEGER,
    "semester" INTEGER,
    "district" TEXT,
    "village" TEXT,
    "membership_status" "MemberStatus" NOT NULL DEFAULT 'NEW',
    "joined_at" TIMESTAMP(3),
    "period_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "departments"
    ADD COLUMN "description" TEXT,
    ADD COLUMN "email" TEXT,
    ADD COLUMN "head_member_id" TEXT,
    ADD COLUMN "period_id" TEXT,
    ADD COLUMN "status" "OrganizationalUnitStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "unit_type" "OrganizationalUnitType" NOT NULL DEFAULT 'DEPARTMENT';

-- AlterTable
ALTER TABLE "programs"
    ADD COLUMN "period_id" TEXT,
    ADD COLUMN "program_type" "ProgramType",
    ADD COLUMN "full_name" TEXT,
    ADD COLUMN "objective" TEXT,
    ADD COLUMN "target_audience" TEXT,
    ADD COLUMN "method" TEXT,
    ADD COLUMN "output" TEXT,
    ADD COLUMN "pic_id" TEXT,
    ADD COLUMN "planned_start" TIMESTAMP(3),
    ADD COLUMN "planned_end" TIMESTAMP(3),
    ADD COLUMN "actual_start" TIMESTAMP(3),
    ADD COLUMN "actual_end" TIMESTAMP(3),
    ADD COLUMN "schedule_status" TEXT,
    ADD COLUMN "planned_budget" DECIMAL(65,30),
    ADD COLUMN "budget_visibility" "Visibility",
    ADD COLUMN "verification_status" "VerificationStatus",
    ADD COLUMN "progress" INTEGER,
    ADD COLUMN "visibility" "Visibility",
    ADD COLUMN "is_featured" BOOLEAN,
    ADD COLUMN "requires_committee" BOOLEAN,
    ADD COLUMN "requires_registration" BOOLEAN,
    ADD COLUMN "registration_type" "RegistrationType";

-- AlterTable
ALTER TABLE "document_archives"
    ADD COLUMN "organizational_unit_id" TEXT,
    ADD COLUMN "period_id" TEXT,
    ADD COLUMN "program_id" TEXT,
    ADD COLUMN "visibility" "Visibility";

-- CreateTable
CREATE TABLE "program_relationships" (
    "id" TEXT NOT NULL,
    "source_program_id" TEXT NOT NULL,
    "target_program_id" TEXT NOT NULL,
    "relationship_type" "ProgramRelationshipType" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendas" (
    "id" TEXT NOT NULL,
    "period_id" TEXT,
    "organizational_unit_id" TEXT,
    "program_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pic_id" TEXT,
    "schedule_type" "AgendaScheduleType" NOT NULL DEFAULT 'FIXED_DATE',
    "start_datetime" TIMESTAMP(3),
    "end_datetime" TIMESTAMP(3),
    "recurrence_rule" TEXT,
    "relative_to_program_id" TEXT,
    "relative_offset" INTEGER,
    "conditional_note" TEXT,
    "location" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'HIDDEN',
    "status" "AgendaStatus" NOT NULL DEFAULT 'DRAFT',
    "requires_registration" BOOLEAN,
    "registration_type" "RegistrationType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "chairman_id" TEXT,
    "secretary_id" TEXT,
    "treasurer_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "CommitteeStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_divisions" (
    "id" TEXT NOT NULL,
    "committee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coordinator_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "committee_divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "committee_division_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "CommitteeMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_banners" (
    "id" TEXT NOT NULL,
    "program_id" TEXT,
    "internal_title" TEXT NOT NULL,
    "phase" "HomepageBannerPhase" NOT NULL,
    "headline" TEXT NOT NULL,
    "supporting_text" TEXT,
    "desktop_image" TEXT,
    "mobile_image" TEXT,
    "cta_label" TEXT,
    "cta_url" TEXT,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "HomepageBannerStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "homepage_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periods_status_idx" ON "periods"("status");

-- CreateIndex
CREATE INDEX "periods_start_date_end_date_idx" ON "periods"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "members_registration_number_key" ON "members"("registration_number");

-- CreateIndex
CREATE INDEX "members_period_id_idx" ON "members"("period_id");

-- CreateIndex
CREATE INDEX "members_membership_status_idx" ON "members"("membership_status");

-- CreateIndex
CREATE INDEX "members_campus_idx" ON "members"("campus");

-- CreateIndex
CREATE INDEX "members_study_program_idx" ON "members"("study_program");

-- CreateIndex
CREATE INDEX "members_entry_year_idx" ON "members"("entry_year");

-- CreateIndex
CREATE INDEX "members_district_idx" ON "members"("district");

-- CreateIndex
CREATE INDEX "departments_head_member_id_idx" ON "departments"("head_member_id");

-- CreateIndex
CREATE INDEX "departments_period_id_idx" ON "departments"("period_id");

-- CreateIndex
CREATE INDEX "departments_status_idx" ON "departments"("status");

-- CreateIndex
CREATE INDEX "departments_unit_type_idx" ON "departments"("unit_type");

-- CreateIndex
CREATE INDEX "programs_period_id_idx" ON "programs"("period_id");

-- CreateIndex
CREATE INDEX "programs_pic_id_idx" ON "programs"("pic_id");

-- CreateIndex
CREATE INDEX "programs_program_type_idx" ON "programs"("program_type");

-- CreateIndex
CREATE INDEX "programs_verification_status_idx" ON "programs"("verification_status");

-- CreateIndex
CREATE INDEX "programs_visibility_idx" ON "programs"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "program_relationships_source_program_id_target_program_id_relationship_type_key" ON "program_relationships"("source_program_id", "target_program_id", "relationship_type");

-- CreateIndex
CREATE INDEX "program_relationships_target_program_id_idx" ON "program_relationships"("target_program_id");

-- CreateIndex
CREATE INDEX "agendas_period_id_idx" ON "agendas"("period_id");

-- CreateIndex
CREATE INDEX "agendas_organizational_unit_id_idx" ON "agendas"("organizational_unit_id");

-- CreateIndex
CREATE INDEX "agendas_program_id_idx" ON "agendas"("program_id");

-- CreateIndex
CREATE INDEX "agendas_pic_id_idx" ON "agendas"("pic_id");

-- CreateIndex
CREATE INDEX "agendas_relative_to_program_id_idx" ON "agendas"("relative_to_program_id");

-- CreateIndex
CREATE INDEX "agendas_schedule_type_idx" ON "agendas"("schedule_type");

-- CreateIndex
CREATE INDEX "agendas_visibility_idx" ON "agendas"("visibility");

-- CreateIndex
CREATE INDEX "agendas_status_idx" ON "agendas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "committees_program_id_key" ON "committees"("program_id");

-- CreateIndex
CREATE INDEX "committees_chairman_id_idx" ON "committees"("chairman_id");

-- CreateIndex
CREATE INDEX "committees_secretary_id_idx" ON "committees"("secretary_id");

-- CreateIndex
CREATE INDEX "committees_treasurer_id_idx" ON "committees"("treasurer_id");

-- CreateIndex
CREATE INDEX "committees_status_idx" ON "committees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "committee_divisions_committee_id_name_key" ON "committee_divisions"("committee_id", "name");

-- CreateIndex
CREATE INDEX "committee_divisions_coordinator_id_idx" ON "committee_divisions"("coordinator_id");

-- CreateIndex
CREATE UNIQUE INDEX "committee_members_committee_division_id_member_id_key" ON "committee_members"("committee_division_id", "member_id");

-- CreateIndex
CREATE INDEX "committee_members_member_id_idx" ON "committee_members"("member_id");

-- CreateIndex
CREATE INDEX "committee_members_status_idx" ON "committee_members"("status");

-- CreateIndex
CREATE INDEX "homepage_banners_program_id_idx" ON "homepage_banners"("program_id");

-- CreateIndex
CREATE INDEX "homepage_banners_created_by_idx" ON "homepage_banners"("created_by");

-- CreateIndex
CREATE INDEX "homepage_banners_phase_idx" ON "homepage_banners"("phase");

-- CreateIndex
CREATE INDEX "homepage_banners_status_idx" ON "homepage_banners"("status");

-- CreateIndex
CREATE INDEX "homepage_banners_start_at_end_at_idx" ON "homepage_banners"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "homepage_banners_priority_idx" ON "homepage_banners"("priority");

-- CreateIndex
CREATE INDEX "document_archives_organizational_unit_id_idx" ON "document_archives"("organizational_unit_id");

-- CreateIndex
CREATE INDEX "document_archives_period_id_idx" ON "document_archives"("period_id");

-- CreateIndex
CREATE INDEX "document_archives_program_id_idx" ON "document_archives"("program_id");

-- CreateIndex
CREATE INDEX "document_archives_visibility_idx" ON "document_archives"("visibility");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_member_id_fkey" FOREIGN KEY ("head_member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_pic_id_fkey" FOREIGN KEY ("pic_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_relationships" ADD CONSTRAINT "program_relationships_source_program_id_fkey" FOREIGN KEY ("source_program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_relationships" ADD CONSTRAINT "program_relationships_target_program_id_fkey" FOREIGN KEY ("target_program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_organizational_unit_id_fkey" FOREIGN KEY ("organizational_unit_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_pic_id_fkey" FOREIGN KEY ("pic_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_relative_to_program_id_fkey" FOREIGN KEY ("relative_to_program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_secretary_id_fkey" FOREIGN KEY ("secretary_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_treasurer_id_fkey" FOREIGN KEY ("treasurer_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_divisions" ADD CONSTRAINT "committee_divisions_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_divisions" ADD CONSTRAINT "committee_divisions_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_committee_division_id_fkey" FOREIGN KEY ("committee_division_id") REFERENCES "committee_divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_banners" ADD CONSTRAINT "homepage_banners_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_banners" ADD CONSTRAINT "homepage_banners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_archives" ADD CONSTRAINT "document_archives_organizational_unit_id_fkey" FOREIGN KEY ("organizational_unit_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_archives" ADD CONSTRAINT "document_archives_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_archives" ADD CONSTRAINT "document_archives_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
