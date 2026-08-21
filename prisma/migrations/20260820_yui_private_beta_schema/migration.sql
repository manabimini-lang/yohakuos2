-- Sprint 60: additive, forward-only YUI private-beta schema recovery.
-- Existing Production tables, including public.reflections, are intentionally untouched.

BEGIN;

CREATE TABLE "yui_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "assistant_name" TEXT,
    "tone" TEXT,
    "life_theme" TEXT,
    "focus_area" TEXT,
    "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "notification_settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yui_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "memories_tags_not_null_check" CHECK ("tags" IS NOT NULL)
);

CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "yui_reflections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "insights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "next_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yui_reflections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "yui_reflections_arrays_not_null_check" CHECK ("insights" IS NOT NULL AND "next_actions" IS NOT NULL)
);

CREATE TABLE "memory_candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "conversation_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memory_candidates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "memory_candidates_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE "decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "decisions_confidence_check" CHECK ("confidence" BETWEEN 0 AND 100)
);

CREATE TABLE "yui_daily_briefs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "brief" JSONB NOT NULL DEFAULT '{}',
    "priority_json" JSONB NOT NULL DEFAULT '[]',
    "context_hash" TEXT NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yui_daily_briefs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "goals_status_check" CHECK ("status" IN ('active', 'paused', 'completed')),
    CONSTRAINT "goals_progress_check" CHECK ("progress" BETWEEN 0 AND 100)
);

CREATE TABLE "suggested_time_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "goal_id" UUID,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'yui_analysis',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suggested_time_blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "suggested_time_blocks_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected', 'created')),
    CONSTRAINT "suggested_time_blocks_time_check" CHECK ("end_at" > "start_at")
);

CREATE TABLE "calendar_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "time_block_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "title" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "external_event_id" TEXT,
    "scheduled_at" TIMESTAMPTZ(6),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calendar_actions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "calendar_actions_status_check" CHECK ("status" IN ('pending', 'approved', 'scheduled', 'rejected')),
    CONSTRAINT "calendar_actions_provider_check" CHECK ("provider" IN ('google_calendar', 'apple_calendar', 'manual')),
    CONSTRAINT "calendar_actions_time_check" CHECK ("end_at" > "start_at")
);

CREATE TABLE "yui_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "related_goal_id" UUID,
    "related_decision_ids" JSONB NOT NULL DEFAULT '[]',
    "related_memory_ids" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yui_recommendations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "yui_recommendations_status_check" CHECK ("status" IN ('pending', 'accepted', 'rejected', 'completed')),
    CONSTRAINT "yui_recommendations_type_check" CHECK ("type" IN ('time_block', 'decision', 'task', 'reflection')),
    CONSTRAINT "yui_recommendations_score_check" CHECK ("score" BETWEEN 0 AND 100)
);

CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "goal_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "milestones_status_check" CHECK ("status" IN ('pending', 'completed'))
);

CREATE TABLE "yui_notification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "morning_enabled" BOOLEAN NOT NULL DEFAULT true,
    "morning_time" TEXT NOT NULL DEFAULT '07:00',
    "evening_enabled" BOOLEAN NOT NULL DEFAULT false,
    "evening_time" TEXT NOT NULL DEFAULT '20:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yui_notification_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "yui_notification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "delivered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'delivered',
    CONSTRAINT "yui_notification_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "yui_notification_logs_type_check" CHECK ("type" IN ('morning', 'evening'))
);

CREATE TABLE "yui_memory_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "memory_key" TEXT NOT NULL,
    "memory_value" TEXT NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "last_observed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yui_memory_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "yui_profiles_user_id_key" ON "yui_profiles"("user_id");
CREATE INDEX "memories_user_id_created_at_idx" ON "memories"("user_id", "created_at");
CREATE INDEX "conversations_user_id_created_at_idx" ON "conversations"("user_id", "created_at");
CREATE INDEX "yui_reflections_user_id_created_at_idx" ON "yui_reflections"("user_id", "created_at");
CREATE INDEX "memory_candidates_user_id_status_created_at_idx" ON "memory_candidates"("user_id", "status", "created_at");
CREATE INDEX "memory_candidates_conversation_id_idx" ON "memory_candidates"("conversation_id");
CREATE INDEX "decisions_user_id_created_at_idx" ON "decisions"("user_id", "created_at");
CREATE UNIQUE INDEX "yui_daily_briefs_user_id_context_hash_key" ON "yui_daily_briefs"("user_id", "context_hash");
CREATE INDEX "yui_daily_briefs_user_id_generated_at_idx" ON "yui_daily_briefs"("user_id", "generated_at");
CREATE INDEX "yui_daily_briefs_context_hash_idx" ON "yui_daily_briefs"("context_hash");
CREATE INDEX "events_user_id_occurred_at_idx" ON "events"("user_id", "occurred_at");
CREATE INDEX "events_user_id_created_at_idx" ON "events"("user_id", "created_at");
CREATE INDEX "events_event_type_idx" ON "events"("event_type");
CREATE INDEX "goals_user_id_created_at_idx" ON "goals"("user_id", "created_at");
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");
CREATE INDEX "suggested_time_blocks_user_id_start_at_idx" ON "suggested_time_blocks"("user_id", "start_at");
CREATE INDEX "suggested_time_blocks_goal_id_idx" ON "suggested_time_blocks"("goal_id");
CREATE INDEX "suggested_time_blocks_user_id_status_idx" ON "suggested_time_blocks"("user_id", "status");
CREATE UNIQUE INDEX "calendar_actions_time_block_id_key" ON "calendar_actions"("time_block_id");
CREATE INDEX "calendar_actions_user_id_status_idx" ON "calendar_actions"("user_id", "status");
CREATE INDEX "calendar_actions_user_id_created_at_idx" ON "calendar_actions"("user_id", "created_at");
CREATE INDEX "yui_recommendations_user_id_status_created_at_idx" ON "yui_recommendations"("user_id", "status", "created_at");
CREATE INDEX "yui_recommendations_user_id_type_created_at_idx" ON "yui_recommendations"("user_id", "type", "created_at");
CREATE INDEX "yui_recommendations_related_goal_id_idx" ON "yui_recommendations"("related_goal_id");
CREATE INDEX "milestones_user_id_goal_id_created_at_idx" ON "milestones"("user_id", "goal_id", "created_at");
CREATE INDEX "milestones_goal_id_idx" ON "milestones"("goal_id");
CREATE UNIQUE INDEX "yui_notification_settings_user_id_key" ON "yui_notification_settings"("user_id");
CREATE INDEX "yui_notification_logs_user_id_delivered_at_idx" ON "yui_notification_logs"("user_id", "delivered_at");
CREATE UNIQUE INDEX "yui_memory_profiles_user_id_memory_key_key" ON "yui_memory_profiles"("user_id", "memory_key");
CREATE INDEX "yui_memory_profiles_user_id_updated_at_idx" ON "yui_memory_profiles"("user_id", "updated_at");

ALTER TABLE "yui_profiles" ADD CONSTRAINT "yui_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_reflections" ADD CONSTRAINT "yui_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_daily_briefs" ADD CONSTRAINT "yui_daily_briefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "suggested_time_blocks" ADD CONSTRAINT "suggested_time_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "suggested_time_blocks" ADD CONSTRAINT "suggested_time_blocks_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_time_block_id_fkey" FOREIGN KEY ("time_block_id") REFERENCES "suggested_time_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_related_goal_id_fkey" FOREIGN KEY ("related_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_notification_settings" ADD CONSTRAINT "yui_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_notification_logs" ADD CONSTRAINT "yui_notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yui_memory_profiles" ADD CONSTRAINT "yui_memory_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION "public"."set_yui_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "yui_profiles_set_updated_at" BEFORE UPDATE ON "yui_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();
CREATE TRIGGER "yui_daily_briefs_set_updated_at" BEFORE UPDATE ON "yui_daily_briefs" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();
CREATE TRIGGER "goals_set_updated_at" BEFORE UPDATE ON "goals" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();
CREATE TRIGGER "suggested_time_blocks_set_updated_at" BEFORE UPDATE ON "suggested_time_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();
CREATE TRIGGER "calendar_actions_set_updated_at" BEFORE UPDATE ON "calendar_actions" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();
CREATE TRIGGER "yui_notification_settings_set_updated_at" BEFORE UPDATE ON "yui_notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();
CREATE TRIGGER "yui_memory_profiles_set_updated_at" BEFORE UPDATE ON "yui_memory_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_yui_updated_at"();

REVOKE ALL PRIVILEGES ON TABLE
    "yui_profiles", "memories", "conversations", "yui_reflections",
    "memory_candidates", "decisions", "yui_daily_briefs", "events", "goals",
    "suggested_time_blocks", "calendar_actions", "yui_recommendations", "milestones",
    "yui_notification_settings", "yui_notification_logs", "yui_memory_profiles"
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    "yui_profiles", "memories", "conversations", "yui_reflections",
    "memory_candidates", "decisions", "yui_daily_briefs", "events", "goals",
    "suggested_time_blocks", "calendar_actions", "yui_recommendations", "milestones",
    "yui_notification_settings", "yui_notification_logs", "yui_memory_profiles"
TO service_role;

ALTER TABLE "yui_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yui_reflections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory_candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "decisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yui_daily_briefs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suggested_time_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yui_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yui_notification_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yui_notification_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yui_memory_profiles" ENABLE ROW LEVEL SECURITY;

-- No policies are created here. auth.uid() is a Supabase Auth UUID, while user_id
-- stores the NextAuth/Prisma User CUID. The server-only service role bypasses RLS,
-- and every runtime operation must remain scoped by the authenticated session user ID.

COMMIT;
