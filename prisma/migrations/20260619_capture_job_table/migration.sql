CREATE TABLE IF NOT EXISTS "snapshot_jobs" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "snapshot_url" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "snapshot_jobs_content_item_id_idx" ON "snapshot_jobs" ("content_item_id");

ALTER TABLE "content_items"
    ADD COLUMN IF NOT EXISTS "snapshot_url" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'snapshot_jobs_content_item_id_fkey'
  ) THEN
    ALTER TABLE "snapshot_jobs"
      ADD CONSTRAINT "snapshot_jobs_content_item_id_fkey"
      FOREIGN KEY ("content_item_id")
      REFERENCES "content_items"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
