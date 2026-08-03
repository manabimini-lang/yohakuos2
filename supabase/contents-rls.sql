ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contents_select_public_or_owner" ON public.contents;
CREATE POLICY "contents_select_public_or_owner"
  ON public.contents
  FOR SELECT
  TO anon, authenticated, postgres
  USING (
    current_user = 'postgres'
    OR (
      publish_status = 'PUBLISHED'
      AND visibility IN ('PUBLIC', 'FREE')
    )
    OR (
      auth.uid() IS NOT NULL
      AND created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "contents_insert_owner_or_postgres" ON public.contents;
CREATE POLICY "contents_insert_owner_or_postgres"
  ON public.contents
  FOR INSERT
  TO authenticated, postgres
  WITH CHECK (
    current_user = 'postgres'
    OR (
      auth.uid() IS NOT NULL
      AND created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "contents_update_owner_or_postgres" ON public.contents;
CREATE POLICY "contents_update_owner_or_postgres"
  ON public.contents
  FOR UPDATE
  TO authenticated, postgres
  USING (
    current_user = 'postgres'
    OR (
      auth.uid() IS NOT NULL
      AND created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    current_user = 'postgres'
    OR (
      auth.uid() IS NOT NULL
      AND created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "contents_delete_owner_or_postgres" ON public.contents;
CREATE POLICY "contents_delete_owner_or_postgres"
  ON public.contents
  FOR DELETE
  TO authenticated, postgres
  USING (
    current_user = 'postgres'
    OR (
      auth.uid() IS NOT NULL
      AND created_by = auth.uid()::text
    )
  );
