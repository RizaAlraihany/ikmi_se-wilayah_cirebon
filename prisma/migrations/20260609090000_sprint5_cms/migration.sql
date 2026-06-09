ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "ContentPlanStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'READY', 'PUBLISHED');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ARCHIVE';

ALTER TABLE "posts"
ADD COLUMN "excerpt" TEXT,
ADD COLUMN "seo_title" TEXT,
ADD COLUMN "seo_description" TEXT,
ADD COLUMN "seo_keywords" TEXT,
ADD COLUMN "reviewed_by" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP(3),
ADD COLUMN "published_by" TEXT,
ADD COLUMN "archived_at" TIMESTAMP(3);

ALTER TABLE "content_plans"
ALTER COLUMN "status" TYPE "ContentPlanStatus"
USING CASE
  WHEN "status"::text = 'PUBLISHED' THEN 'PUBLISHED'::"ContentPlanStatus"
  WHEN "status"::text = 'PENDING_REVIEW' THEN 'READY'::"ContentPlanStatus"
  ELSE 'PLANNED'::"ContentPlanStatus"
END;

CREATE TABLE "media_assets" (
  "id" TEXT NOT NULL,
  "public_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "secure_url" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "folder" TEXT NOT NULL,
  "uploaded_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_assets_public_id_key" ON "media_assets"("public_id");
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets"("uploaded_by");
CREATE INDEX "media_assets_mime_type_idx" ON "media_assets"("mime_type");
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_uploaded_by_fkey"
FOREIGN KEY ("uploaded_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
