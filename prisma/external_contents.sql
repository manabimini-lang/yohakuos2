-- 1. Create table external_contents
CREATE TABLE IF NOT EXISTS "external_contents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "type" TEXT NOT NULL,
  "road" TEXT NOT NULL,
  "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE "external_contents" ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- SELECT: authenticated users only
DROP POLICY IF EXISTS "external_contents_select_policy" ON "external_contents";
CREATE POLICY "external_contents_select_policy" ON "external_contents"
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: admin only (SUPER_ADMIN or ADMIN role)
DROP POLICY IF EXISTS "external_contents_admin_policy" ON "external_contents";
CREATE POLICY "external_contents_admin_policy" ON "external_contents"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role::text IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
