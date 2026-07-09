CREATE TABLE "document_archives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_public_id" TEXT,
    "archived_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "document_archives_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_archives_category_idx" ON "document_archives"("category");
CREATE INDEX "document_archives_archived_at_idx" ON "document_archives"("archived_at");
