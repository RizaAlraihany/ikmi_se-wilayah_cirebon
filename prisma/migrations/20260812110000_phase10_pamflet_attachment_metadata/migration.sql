ALTER TABLE "pamflet_requests"
ADD COLUMN "attachment_original_name" TEXT,
ADD COLUMN "attachment_mime_type" TEXT,
ADD COLUMN "attachment_size" INTEGER;
