-- ==============================================================================
-- YOHAKU Capture Inbox Layer - Storage and RLS Setup
-- ==============================================================================
-- Run this in your Supabase SQL Editor.

-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'yohaku-content',
    'yohaku-content',
    false, -- Private bucket, accessed via signed URLs or directly if auth matched
    20971520, -- 20MB in bytes
    '{ "application/pdf" }'
) ON CONFLICT (id) DO NOTHING;

-- 2. Storage Bucket Policies (Authenticated users can upload to their own folder, read their own files)
CREATE POLICY "Users can upload their own content"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'yohaku-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own content"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'yohaku-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own content"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'yohaku-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own content"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'yohaku-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Database Table RLS (content_items)
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content_items"
ON public.content_items FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own content_items"
ON public.content_items FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own content_items"
ON public.content_items FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own content_items"
ON public.content_items FOR DELETE TO authenticated
USING (user_id = auth.uid()::text);
