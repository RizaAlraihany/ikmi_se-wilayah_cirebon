-- Preserve legacy Blogger provenance so one-time imports are traceable and idempotent.
ALTER TABLE "posts"
  ADD COLUMN "source_provider" TEXT,
  ADD COLUMN "source_post_id" TEXT,
  ADD COLUMN "source_url" TEXT;

CREATE INDEX "posts_source_provider_source_post_id_idx"
  ON "posts"("source_provider", "source_post_id");

CREATE UNIQUE INDEX "posts_source_provider_source_post_id_key"
  ON "posts"("source_provider", "source_post_id");
