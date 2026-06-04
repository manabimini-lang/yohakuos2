-- Prisma Baseline Migration (P3.5)
-- Generated from actual DB state on 2026-06-04T12:13:55.394Z
-- This migration represents the existing DB schema and is applied as a baseline.

CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" USER-DEFINED NOT NULL DEFAULT 'pending'::"JobStatus",
    "priority" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "last_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "token_used" INTEGER,
    "cost_estimate" DOUBLE PRECISION,
    "scheduled_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP,
    "processed_at" TIMESTAMP,
    "completed_at" TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ambient_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_memory_ids" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "surfaced_at" TIMESTAMP NOT NULL,
    "dismissed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audio_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_item_id" TEXT,
    "memory_resonance_id" TEXT,
    "script" TEXT NOT NULL,
    "audio_url" TEXT,
    "voice_provider" TEXT,
    "voice_model" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending'::text,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info'::text,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "companion_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT ''::text,
    "context_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "companion_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" USER-DEFINED NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "memory_snapshot" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "thumbnail_url" TEXT,
    "domain" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "memory_state" TEXT NOT NULL DEFAULT 'active'::text,
    "summary" TEXT,
    "ai_tags" TEXT[],
    "content_type" TEXT,
    "reflection" TEXT,
    "ai_status" TEXT NOT NULL DEFAULT 'pending'::text,
    "embedding" USER-DEFINED,
    "embedding_model" TEXT,
    "embedding_dimensions" INTEGER,
    "ai_version" TEXT,
    "ai_processed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_tags" (
    "content_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    PRIMARY KEY ("content_id", "tag_id")
);

CREATE TABLE IF NOT EXISTS "contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "content" TEXT,
    "content_type" USER-DEFINED NOT NULL,
    "visibility" USER-DEFINED NOT NULL,
    "publish_status" USER-DEFINED NOT NULL DEFAULT 'DRAFT'::"PublishStatus",
    "layer" USER-DEFINED NOT NULL,
    "release_date" TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversation_insights" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversation_summaries" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "summary_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversation_themes" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mood_tag" TEXT,
    "input_text" TEXT NOT NULL,
    "ai_response" TEXT,
    "small_action" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_rituals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "quiet_question" TEXT NOT NULL,
    "ambient_reflection" TEXT NOT NULL,
    "returning_themes" JSONB NOT NULL,
    "philosophy_fragments" JSONB NOT NULL,
    "past_memories" JSONB NOT NULL,
    "audio_reflection_id" TEXT,
    "audio_url" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "direction_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "intention" TEXT NOT NULL,
    "values" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "quiet_wish" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "period" TEXT NOT NULL DEFAULT 'current'::text,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "emotional_cooldowns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cooldown_type" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 3,
    "source_id" TEXT,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "energy_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" USER-DEFINED NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 3,
    "source_reflection_id" TEXT,
    "note" TEXT,
    "area_type" USER-DEFINED,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "external_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "type" TEXT NOT NULL,
    "road" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "habit_flows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "status" USER-DEFINED NOT NULL DEFAULT 'active'::"HabitFlowStatus",
    "intensity" INTEGER NOT NULL DEFAULT 1,
    "area_type" USER-DEFINED,
    "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "identity_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "traits" JSONB NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inner_landscapes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "seasonalAir" TEXT,
    "quietCurrents" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "returningQuestions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "resonanceWeather" TEXT,
    "philosophyEchoes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "dominantTheme" TEXT,
    "generated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" USER-DEFINED NOT NULL,
    "source" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "summary" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "content_type" TEXT NOT NULL,
    "tags" TEXT[],
    "embedding" USER-DEFINED,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learning_suggestions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_item_id" TEXT,
    "knowledge_content_id" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "legacy_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "themes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "chapters" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "life_areas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" USER-DEFINED NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "life_balances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "life_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" USER-DEFINED NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source_ids" TEXT[],
    "area_type" USER-DEFINED,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meaning_signals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "area_type" USER-DEFINED,
    "related_memory_ids" TEXT[],
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "memory_graph_edges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_content_id" TEXT NOT NULL,
    "to_content_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reason" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "memory_resurfacings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_content_id" TEXT,
    "related_content_id" TEXT,
    "message" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "memory_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "themes" JSONB NOT NULL,
    "reflections" JSONB NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "memory_sources" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "philosophy_fragments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fragment" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "resonance_score" DOUBLE PRECISION NOT NULL,
    "related_theme" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quiet_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intention" TEXT NOT NULL,
    "next_step" TEXT,
    "note" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reflection_text" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "type" TEXT,
    "confidence" DOUBLE PRECISION,
    "triggeredBy" TEXT[],
    "sentiment" TEXT,
    "prompt_version" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "resonance_patterns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "source_memory_ids" TEXT[],
    "evidence_ids" TEXT[],
    "first_observed_at" TIMESTAMP NOT NULL,
    "observed_count" INTEGER NOT NULL DEFAULT 1,
    "last_observed_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "risk_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'pending'::text,
    "assigned_to" TEXT,
    "notes" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "road_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "road_slug" TEXT NOT NULL,
    "road_title" TEXT NOT NULL,
    "road_icon" TEXT,
    "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "road_prompts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "road_id" UUID NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "road_transitions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_road" TEXT NOT NULL,
    "to_road" TEXT NOT NULL,
    "reflection" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "roads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "seasonal_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "themes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id", "id")
);

CREATE TABLE IF NOT EXISTS "shared_knowledge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "road" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'global'::text,
    "siteTitle" TEXT NOT NULL DEFAULT 'YOHAKU'::text,
    "site_description" TEXT NOT NULL DEFAULT '学びを、余白のある習慣に。'::text,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#0f172a'::text,
    "card_style" USER-DEFINED NOT NULL DEFAULT 'DEFAULT'::"CardStyle",
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "slow_feed_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "surfaced_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "state_transitions" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_id" TEXT,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'incomplete'::text,
    "current_period_end" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "suggested_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "road" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_ai_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gemini'::text,
    "encrypted_api_key" TEXT,
    "model" TEXT,
    "embeddings_model" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "starter_journey_started_at" TIMESTAMP,
    "starter_journey_expires_at" TIMESTAMP,
    "starter_journey_companion_message_count" INTEGER NOT NULL DEFAULT 0,
    "starter_journey_companion_message_limit" INTEGER NOT NULL DEFAULT 20,
    "daily_token_usage" INTEGER NOT NULL DEFAULT 0,
    "monthly_token_usage" INTEGER NOT NULL DEFAULT 0,
    "last_usage_reset" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "last_validated_at" TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "api_provider" TEXT NOT NULL DEFAULT 'gemini'::text,
    "encrypted_key" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" USER-DEFINED NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fingerprint" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "superseded_id" TEXT,
    "source_card_id" TEXT,
    "prompt_version" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "email_verified" TIMESTAMP,
    "role" USER-DEFINED NOT NULL DEFAULT 'FREE_MEMBER'::"UserRole",
    "plan_type" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free'::text,
    "discord_id" TEXT,
    "discord_name" TEXT,
    "discord_avatar" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP,
    "mfa_secret" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY ("id", "id")
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "weekly_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TIMESTAMP NOT NULL,
    "reflection" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
