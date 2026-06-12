-- Normalize external_contents IDs to YOHAKU string IDs
ALTER TABLE "external_contents"
  ALTER COLUMN "id" TYPE TEXT USING "id"::text;

ALTER TABLE "external_contents"
  ALTER COLUMN "created_by" TYPE TEXT USING "created_by"::text;

-- Keep relation integrity explicit for the string-based User.id model.
ALTER TABLE "external_contents"
  DROP CONSTRAINT IF EXISTS "external_contents_created_by_fkey";

ALTER TABLE "external_contents"
  ADD CONSTRAINT "external_contents_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
