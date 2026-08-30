-- Phase 14 expands the publication workflow and SEO media without removing legacy data.
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'REVISION';

ALTER TABLE "posts"
  ADD COLUMN IF NOT EXISTS "og_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "og_image_public_id" TEXT,
  ADD COLUMN IF NOT EXISTS "revision_notes" TEXT;
