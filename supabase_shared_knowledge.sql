-- ====================================================================
-- SUPABASE MIGRATION SCRIPT
-- Title: Create shared_knowledge table with RLS Policies
-- Description: Run this SQL query directly in your Supabase SQL Editor.
-- ====================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.shared_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    road TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.shared_knowledge ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies

-- Policy A: View policy (Only authenticated users can select/view all rows)
DROP POLICY IF EXISTS "Allow authenticated select" ON public.shared_knowledge;
CREATE POLICY "Allow authenticated select" ON public.shared_knowledge
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy B: Create policy (Only authenticated users can insert new rows)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.shared_knowledge;
CREATE POLICY "Allow authenticated insert" ON public.shared_knowledge
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by OR created_by IS NOT NULL);

-- Policy C: Update policy (Users can only update their own rows)
DROP POLICY IF EXISTS "Allow individual update" ON public.shared_knowledge;
CREATE POLICY "Allow individual update" ON public.shared_knowledge
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy D: Delete policy (Users can only delete their own rows)
DROP POLICY IF EXISTS "Allow individual delete" ON public.shared_knowledge;
CREATE POLICY "Allow individual delete" ON public.shared_knowledge
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
