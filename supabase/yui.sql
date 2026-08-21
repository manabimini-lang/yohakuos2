-- ==============================================================================
-- YOHAKU YUI Layer - Supabase / Postgres Schema
-- ==============================================================================
-- LEGACY REFERENCE ONLY: do not execute this monolith against Production.
-- Versioned Prisma migrations are the executable schema source of truth.
-- Sprint 1: YUI Personal OS prototype foundation
-- - Existing YOHAKU admin / pipeline tables stay untouched
-- - YUI data is stored separately and is ready for RLS-based access
-- - No data migration is performed in this sprint
-- ==============================================================================

-- 1. YUI profiles
CREATE TABLE IF NOT EXISTS public.yui_profiles (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT NOT NULL UNIQUE,
  display_name           TEXT,
  assistant_name         TEXT,
  tone                   TEXT,
  life_theme             TEXT,
  focus_area             TEXT,
  preferences            JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_settings  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.yui_profiles
  ADD COLUMN IF NOT EXISTS assistant_name TEXT;

ALTER TABLE public.yui_profiles
  ADD COLUMN IF NOT EXISTS tone TEXT;

ALTER TABLE public.yui_profiles
  ADD COLUMN IF NOT EXISTS life_theme TEXT;

ALTER TABLE public.yui_profiles
  ADD COLUMN IF NOT EXISTS focus_area TEXT;

ALTER TABLE public.yui_profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_yui_profiles_user_id
  ON public.yui_profiles (user_id);

ALTER TABLE public.yui_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yui_profiles_select_own" ON public.yui_profiles;
CREATE POLICY "yui_profiles_select_own"
  ON public.yui_profiles
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_profiles_insert_own" ON public.yui_profiles;
CREATE POLICY "yui_profiles_insert_own"
  ON public.yui_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_profiles_update_own" ON public.yui_profiles;
CREATE POLICY "yui_profiles_update_own"
  ON public.yui_profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_profiles_delete_own" ON public.yui_profiles;
CREATE POLICY "yui_profiles_delete_own"
  ON public.yui_profiles
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_yui_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_yui_profiles_updated_at ON public.yui_profiles;
CREATE TRIGGER trigger_yui_profiles_updated_at
  BEFORE UPDATE ON public.yui_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_yui_profiles_updated_at();

-- 2. Memories
CREATE TABLE IF NOT EXISTS public.memories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  body        TEXT NOT NULL,
  importance  INTEGER NOT NULL DEFAULT 0,
  tags        TEXT[] NOT NULL DEFAULT '{}'::text[],
  source_type TEXT NOT NULL DEFAULT 'manual',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id_created_at
  ON public.memories (user_id, created_at DESC);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select_own" ON public.memories;
CREATE POLICY "memories_select_own"
  ON public.memories
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "memories_insert_own" ON public.memories;
CREATE POLICY "memories_insert_own"
  ON public.memories
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "memories_update_own" ON public.memories;
CREATE POLICY "memories_update_own"
  ON public.memories
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "memories_delete_own" ON public.memories;
CREATE POLICY "memories_delete_own"
  ON public.memories
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 3. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id_created_at
  ON public.conversations (user_id, created_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_own" ON public.conversations;
CREATE POLICY "conversations_select_own"
  ON public.conversations
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
CREATE POLICY "conversations_insert_own"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "conversations_update_own" ON public.conversations;
CREATE POLICY "conversations_update_own"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "conversations_delete_own" ON public.conversations;
CREATE POLICY "conversations_delete_own"
  ON public.conversations
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 4. Reflections
CREATE TABLE IF NOT EXISTS public.yui_reflections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  summary      TEXT NOT NULL,
  insights     TEXT[] NOT NULL DEFAULT '{}'::text[],
  next_actions TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yui_reflections_user_id_created_at
  ON public.yui_reflections (user_id, created_at DESC);

ALTER TABLE public.yui_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yui_reflections_select_own" ON public.yui_reflections;
CREATE POLICY "yui_reflections_select_own"
  ON public.yui_reflections
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_reflections_insert_own" ON public.yui_reflections;
CREATE POLICY "yui_reflections_insert_own"
  ON public.yui_reflections
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_reflections_update_own" ON public.yui_reflections;
CREATE POLICY "yui_reflections_update_own"
  ON public.yui_reflections
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_reflections_delete_own" ON public.yui_reflections;
CREATE POLICY "yui_reflections_delete_own"
  ON public.yui_reflections
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 5. Memory candidates
CREATE TABLE IF NOT EXISTS public.memory_candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL,
  reason          TEXT NOT NULL,
  importance      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT memory_candidates_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_memory_candidates_user_status_created_at
  ON public.memory_candidates (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_candidates_conversation_id
  ON public.memory_candidates (conversation_id);

ALTER TABLE public.memory_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_candidates_select_own" ON public.memory_candidates;
CREATE POLICY "memory_candidates_select_own"
  ON public.memory_candidates
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "memory_candidates_insert_own" ON public.memory_candidates;
CREATE POLICY "memory_candidates_insert_own"
  ON public.memory_candidates
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "memory_candidates_update_own" ON public.memory_candidates;
CREATE POLICY "memory_candidates_update_own"
  ON public.memory_candidates
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "memory_candidates_delete_own" ON public.memory_candidates;
CREATE POLICY "memory_candidates_delete_own"
  ON public.memory_candidates
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 6. Decisions
CREATE TABLE IF NOT EXISTS public.decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  question    TEXT NOT NULL,
  context     TEXT NOT NULL,
  decision    TEXT NOT NULL,
  rationale   TEXT NOT NULL,
  confidence  INTEGER NOT NULL DEFAULT 50,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_user_id_created_at
  ON public.decisions (user_id, created_at DESC);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decisions_select_own" ON public.decisions;
CREATE POLICY "decisions_select_own"
  ON public.decisions
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "decisions_insert_own" ON public.decisions;
CREATE POLICY "decisions_insert_own"
  ON public.decisions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "decisions_update_own" ON public.decisions;
CREATE POLICY "decisions_update_own"
  ON public.decisions
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "decisions_delete_own" ON public.decisions;
CREATE POLICY "decisions_delete_own"
  ON public.decisions
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 7. Daily brief cache
CREATE TABLE IF NOT EXISTS public.yui_daily_briefs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  brief         JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_hash  TEXT NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, context_hash)
);

CREATE INDEX IF NOT EXISTS idx_yui_daily_briefs_user_id_generated_at
  ON public.yui_daily_briefs (user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_yui_daily_briefs_context_hash
  ON public.yui_daily_briefs (context_hash);

ALTER TABLE public.yui_daily_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yui_daily_briefs_select_own" ON public.yui_daily_briefs;
CREATE POLICY "yui_daily_briefs_select_own"
  ON public.yui_daily_briefs
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_daily_briefs_insert_own" ON public.yui_daily_briefs;
CREATE POLICY "yui_daily_briefs_insert_own"
  ON public.yui_daily_briefs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_daily_briefs_update_own" ON public.yui_daily_briefs;
CREATE POLICY "yui_daily_briefs_update_own"
  ON public.yui_daily_briefs
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_daily_briefs_delete_own" ON public.yui_daily_briefs;
CREATE POLICY "yui_daily_briefs_delete_own"
  ON public.yui_daily_briefs
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_yui_daily_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_yui_daily_briefs_updated_at ON public.yui_daily_briefs;
CREATE TRIGGER trigger_yui_daily_briefs_updated_at
  BEFORE UPDATE ON public.yui_daily_briefs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_yui_daily_briefs_updated_at();

-- 8. Events
CREATE TABLE IF NOT EXISTS public.events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  source       TEXT NOT NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id_occurred_at
  ON public.events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_user_id_created_at
  ON public.events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_event_type
  ON public.events (event_type);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_own" ON public.events;
CREATE POLICY "events_select_own"
  ON public.events
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "events_insert_own" ON public.events;
CREATE POLICY "events_insert_own"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "events_update_own" ON public.events;
CREATE POLICY "events_update_own"
  ON public.events
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "events_delete_own" ON public.events;
CREATE POLICY "events_delete_own"
  ON public.events
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 8. Connections
CREATE TABLE IF NOT EXISTS public.connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  provider      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  permissions   JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  connected_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT connections_status_check CHECK (status IN ('pending', 'connected', 'disconnected'))
);

CREATE INDEX IF NOT EXISTS idx_connections_user_id_provider
  ON public.connections (user_id, provider);

CREATE INDEX IF NOT EXISTS idx_connections_user_id_status
  ON public.connections (user_id, status);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_select_own" ON public.connections;
CREATE POLICY "connections_select_own"
  ON public.connections
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "connections_insert_own" ON public.connections;
CREATE POLICY "connections_insert_own"
  ON public.connections
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "connections_update_own" ON public.connections;
CREATE POLICY "connections_update_own"
  ON public.connections
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "connections_delete_own" ON public.connections;
CREATE POLICY "connections_delete_own"
  ON public.connections
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_connections_updated_at ON public.connections;
CREATE TRIGGER trigger_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_connections_updated_at();

-- 9. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  connection_id  UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,
  external_id    TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  start_at       TIMESTAMPTZ NOT NULL,
  end_at         TIMESTAMPTZ NOT NULL,
  location       TEXT,
  status         TEXT NOT NULL DEFAULT 'confirmed',
  source         TEXT NOT NULL DEFAULT 'external',
  event_category TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT calendar_events_status_check CHECK (status IN ('confirmed', 'tentative', 'cancelled'))
);

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'external';

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS event_category TEXT;

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id_start_at
  ON public.calendar_events (user_id, start_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_connection_id
  ON public.calendar_events (connection_id);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_select_own" ON public.calendar_events;
CREATE POLICY "calendar_events_select_own"
  ON public.calendar_events
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "calendar_events_insert_own" ON public.calendar_events;
CREATE POLICY "calendar_events_insert_own"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "calendar_events_update_own" ON public.calendar_events;
CREATE POLICY "calendar_events_update_own"
  ON public.calendar_events
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "calendar_events_delete_own" ON public.calendar_events;
CREATE POLICY "calendar_events_delete_own"
  ON public.calendar_events
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER trigger_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_calendar_events_updated_at();

-- 10. Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  progress    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT goals_status_check CHECK (status IN ('active', 'paused', 'completed')),
  CONSTRAINT goals_progress_check CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id_created_at
  ON public.goals (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_goals_user_id_status
  ON public.goals (user_id, status);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
CREATE POLICY "goals_select_own"
  ON public.goals
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
CREATE POLICY "goals_insert_own"
  ON public.goals
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
CREATE POLICY "goals_update_own"
  ON public.goals
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_delete_own"
  ON public.goals
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_goals_updated_at ON public.goals;
CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_goals_updated_at();

-- 11. Suggested Time Blocks
CREATE TABLE IF NOT EXISTS public.suggested_time_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  goal_id     UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  reason      TEXT NOT NULL,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  source      TEXT NOT NULL DEFAULT 'yui_analysis',
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT suggested_time_blocks_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'created'))
);

CREATE INDEX IF NOT EXISTS idx_suggested_time_blocks_user_id_start_at
  ON public.suggested_time_blocks (user_id, start_at);

CREATE INDEX IF NOT EXISTS idx_suggested_time_blocks_goal_id
  ON public.suggested_time_blocks (goal_id);

CREATE INDEX IF NOT EXISTS idx_suggested_time_blocks_status
  ON public.suggested_time_blocks (user_id, status);

ALTER TABLE public.suggested_time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suggested_time_blocks_select_own" ON public.suggested_time_blocks;
CREATE POLICY "suggested_time_blocks_select_own"
  ON public.suggested_time_blocks
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "suggested_time_blocks_insert_own" ON public.suggested_time_blocks;
CREATE POLICY "suggested_time_blocks_insert_own"
  ON public.suggested_time_blocks
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "suggested_time_blocks_update_own" ON public.suggested_time_blocks;
CREATE POLICY "suggested_time_blocks_update_own"
  ON public.suggested_time_blocks
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "suggested_time_blocks_delete_own" ON public.suggested_time_blocks;
CREATE POLICY "suggested_time_blocks_delete_own"
  ON public.suggested_time_blocks
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_suggested_time_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_suggested_time_blocks_updated_at ON public.suggested_time_blocks;
CREATE TRIGGER trigger_suggested_time_blocks_updated_at
  BEFORE UPDATE ON public.suggested_time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_suggested_time_blocks_updated_at();

-- 12. Calendar Actions
CREATE TABLE IF NOT EXISTS public.calendar_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  time_block_id     UUID NOT NULL REFERENCES public.suggested_time_blocks(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'manual',
  title             TEXT NOT NULL,
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  external_event_id TEXT,
  scheduled_at      TIMESTAMPTZ,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT calendar_actions_status_check CHECK (status IN ('pending', 'approved', 'scheduled', 'rejected')),
  CONSTRAINT calendar_actions_provider_check CHECK (provider IN ('google_calendar', 'apple_calendar', 'manual'))
);

ALTER TABLE public.calendar_actions
  ADD COLUMN IF NOT EXISTS external_event_id TEXT;

ALTER TABLE public.calendar_actions
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE public.calendar_actions
  ADD COLUMN IF NOT EXISTS reason TEXT;

CREATE INDEX IF NOT EXISTS idx_calendar_actions_user_id_status
  ON public.calendar_actions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_calendar_actions_user_id_created_at
  ON public.calendar_actions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_actions_time_block_id
  ON public.calendar_actions (time_block_id);

ALTER TABLE public.calendar_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_actions_select_own" ON public.calendar_actions;
CREATE POLICY "calendar_actions_select_own"
  ON public.calendar_actions
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "calendar_actions_insert_own" ON public.calendar_actions;
CREATE POLICY "calendar_actions_insert_own"
  ON public.calendar_actions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "calendar_actions_update_own" ON public.calendar_actions;
CREATE POLICY "calendar_actions_update_own"
  ON public.calendar_actions
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "calendar_actions_delete_own" ON public.calendar_actions;
CREATE POLICY "calendar_actions_delete_own"
  ON public.calendar_actions
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_calendar_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calendar_actions_updated_at ON public.calendar_actions;
CREATE TRIGGER trigger_calendar_actions_updated_at
  BEFORE UPDATE ON public.calendar_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_calendar_actions_updated_at();

-- 13. Recommendations
CREATE TABLE IF NOT EXISTS public.yui_recommendations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL,
  type                 TEXT NOT NULL,
  title                TEXT NOT NULL,
  content              TEXT NOT NULL DEFAULT '',
  reason               TEXT NOT NULL,
  score                INTEGER NOT NULL DEFAULT 0,
  related_goal_id      UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  related_decision_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_memory_ids   JSONB NOT NULL DEFAULT '[]'::jsonb,
  status               TEXT NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT yui_recommendations_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  CONSTRAINT yui_recommendations_type_check CHECK (type IN ('time_block', 'decision', 'task', 'reflection')),
  CONSTRAINT yui_recommendations_score_check CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_yui_recommendations_user_status_created_at
  ON public.yui_recommendations (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_yui_recommendations_user_type_created_at
  ON public.yui_recommendations (user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_yui_recommendations_goal_id
  ON public.yui_recommendations (related_goal_id);

ALTER TABLE public.yui_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yui_recommendations_select_own" ON public.yui_recommendations;
CREATE POLICY "yui_recommendations_select_own"
  ON public.yui_recommendations
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_recommendations_insert_own" ON public.yui_recommendations;
CREATE POLICY "yui_recommendations_insert_own"
  ON public.yui_recommendations
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_recommendations_update_own" ON public.yui_recommendations;
CREATE POLICY "yui_recommendations_update_own"
  ON public.yui_recommendations
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_recommendations_delete_own" ON public.yui_recommendations;
CREATE POLICY "yui_recommendations_delete_own"
  ON public.yui_recommendations
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 8. Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  goal_id     UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT milestones_status_check CHECK (status IN ('pending', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_id_goal_id_created_at
  ON public.milestones (user_id, goal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_milestones_goal_id
  ON public.milestones (goal_id);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestones_select_own" ON public.milestones;
CREATE POLICY "milestones_select_own"
  ON public.milestones
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "milestones_insert_own" ON public.milestones;
CREATE POLICY "milestones_insert_own"
  ON public.milestones
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1
      FROM public.goals goals
      WHERE goals.id = goal_id
        AND goals.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "milestones_update_own" ON public.milestones;
CREATE POLICY "milestones_update_own"
  ON public.milestones
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1
      FROM public.goals goals
      WHERE goals.id = goal_id
        AND goals.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "milestones_delete_own" ON public.milestones;
CREATE POLICY "milestones_delete_own"
  ON public.milestones
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 14. YUI Notification Settings
CREATE TABLE IF NOT EXISTS public.yui_notification_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL UNIQUE,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  morning_enabled  BOOLEAN NOT NULL DEFAULT true,
  morning_time     TEXT NOT NULL DEFAULT '07:00',
  evening_enabled  BOOLEAN NOT NULL DEFAULT false,
  evening_time     TEXT NOT NULL DEFAULT '20:00',
  timezone         TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yui_notification_settings_user_id
  ON public.yui_notification_settings (user_id);

ALTER TABLE public.yui_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yui_notification_settings_select_own" ON public.yui_notification_settings;
CREATE POLICY "yui_notification_settings_select_own"
  ON public.yui_notification_settings
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_notification_settings_insert_own" ON public.yui_notification_settings;
CREATE POLICY "yui_notification_settings_insert_own"
  ON public.yui_notification_settings
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_notification_settings_update_own" ON public.yui_notification_settings;
CREATE POLICY "yui_notification_settings_update_own"
  ON public.yui_notification_settings
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "yui_notification_settings_delete_own" ON public.yui_notification_settings;
CREATE POLICY "yui_notification_settings_delete_own"
  ON public.yui_notification_settings
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_yui_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_yui_notification_settings_updated_at ON public.yui_notification_settings;
CREATE TRIGGER trigger_yui_notification_settings_updated_at
  BEFORE UPDATE ON public.yui_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_yui_notification_settings_updated_at();

-- ==============================================================================
-- 10. YUI notification logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.yui_notification_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  type         TEXT NOT NULL, -- 'morning' | 'evening'
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider     TEXT NOT NULL DEFAULT 'mock',
  status       TEXT NOT NULL DEFAULT 'delivered'
);

CREATE INDEX IF NOT EXISTS idx_yui_notification_logs_user_id
  ON public.yui_notification_logs (user_id);

-- ==============================================================================
-- 11. YUI memory profiles (Behavioral tendencies)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.yui_memory_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  memory_key       TEXT NOT NULL,
  memory_value     TEXT NOT NULL,
  confidence       NUMERIC NOT NULL DEFAULT 1.0,
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_yui_memory_profiles_user_id
  ON public.yui_memory_profiles (user_id);
