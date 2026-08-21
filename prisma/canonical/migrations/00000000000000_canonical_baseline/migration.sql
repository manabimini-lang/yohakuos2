-- Fresh-environment-only canonical snapshot generated from prisma/schema.prisma.
-- Never apply or resolve this migration against the existing Production ledger.

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "SnapshotStatus" AS ENUM ('GENERATED', 'EMPTY_WEEK', 'AI_FAILED');

-- CreateEnum
CREATE TYPE "WisdomInsightType" AS ENUM ('ALIGNMENT', 'DIVERGENCE', 'EMERGING_PATTERN', 'COMMUNITY_SIGNAL');

-- CreateEnum
CREATE TYPE "ReflectionTheme" AS ENUM ('GROWTH', 'RESTORATION', 'CONNECTION', 'EXPLORATION', 'STABILITY', 'CREATIVITY');

-- CreateEnum
CREATE TYPE "RecommendationStrategy" AS ENUM ('SMALL_WIN', 'RECOVERY', 'CHALLENGE', 'EXPLORATION', 'REFLECTION');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'PAID_MEMBER', 'FREE_MEMBER');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'VIDEO', 'TASK', 'UPDATE');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('PUBLIC', 'FREE', 'PAID', 'ADMIN');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ContentLayer" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CardStyle" AS ENUM ('COMPACT', 'DEFAULT', 'COMFORTABLE');

-- CreateEnum
CREATE TYPE "ThemeType" AS ENUM ('WORK', 'LEARNING', 'HEALTH', 'FAMILY', 'PARENTING', 'SIDEBUSINESS', 'CREATION', 'AI', 'ENGLISH', 'HOBBY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('LEARNING', 'CONTINUITY', 'CHALLENGE', 'CREATION', 'EXPLORATION', 'HEALTH', 'FAMILY', 'WORK', 'SHARING', 'REFLECTION');

-- CreateEnum
CREATE TYPE "LifeAreaType" AS ENUM ('Health', 'Learning', 'Work', 'Creativity', 'Relationships', 'Mind', 'Rest', 'Challenge');

-- CreateEnum
CREATE TYPE "HabitFlowStatus" AS ENUM ('active', 'paused', 'completed', 'naturally_ended');

-- CreateEnum
CREATE TYPE "LifeReflectionType" AS ENUM ('weekly', 'monthly', 'seasonal', 'half_year', 'yearly', 'goal');

-- CreateEnum
CREATE TYPE "EnergyStateType" AS ENUM ('calm_focus', 'exhaustion', 'recovery', 'curiosity', 'instability', 'groundedness');

-- CreateEnum
CREATE TYPE "KnowledgeCardType" AS ENUM ('url', 'text', 'youtube', 'pdf', 'voice', 'web_clipping', 'ai_conversation', 'reflection');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('value', 'belief', 'goal', 'fear', 'motivation', 'learning_style', 'habit', 'personality_trait', 'reflection', 'emotional_pattern', 'life_theme', 'behavior_pattern', 'thinking_pattern');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'deduped');

-- CreateTable
CREATE TABLE "system_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "email_verified" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'FREE_MEMBER',
    "plan_type" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "discord_id" TEXT,
    "discord_name" TEXT,
    "discord_avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "mfa_secret" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "api_provider" TEXT NOT NULL DEFAULT 'gemini',
    "encrypted_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gemini',
    "encrypted_api_key" TEXT,
    "model" TEXT,
    "embeddings_model" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "starter_journey_started_at" TIMESTAMP(3),
    "starter_journey_expires_at" TIMESTAMP(3),
    "starter_journey_companion_message_count" INTEGER NOT NULL DEFAULT 0,
    "starter_journey_companion_message_limit" INTEGER NOT NULL DEFAULT 20,
    "daily_token_usage" INTEGER NOT NULL DEFAULT 0,
    "monthly_token_usage" INTEGER NOT NULL DEFAULT 0,
    "last_usage_reset" TIMESTAMP(3),
    "last_validated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mood_tag" TEXT,
    "input_text" TEXT NOT NULL,
    "ai_response" TEXT,
    "small_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflections" (
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "content" TEXT,
    "content_type" "ContentType" NOT NULL,
    "visibility" "ContentVisibility" NOT NULL,
    "publish_status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "layer" "ContentLayer" NOT NULL,
    "release_date" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tags" (
    "content_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("content_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
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

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "risk_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_to" TEXT,
    "notes" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "siteTitle" TEXT NOT NULL DEFAULT 'YOHAKU',
    "site_description" TEXT NOT NULL DEFAULT '学びを、余白のある習慣に。',
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#0f172a',
    "card_style" "CardStyle" NOT NULL DEFAULT 'DEFAULT',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_transitions" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "metadata" JSONB DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_knowledge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "road" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "type" TEXT NOT NULL,
    "road" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "external_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggested_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "road" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "suggested_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_prompts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "road_id" UUID NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "road_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_areas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "LifeAreaType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_flows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "status" "HabitFlowStatus" NOT NULL DEFAULT 'active',
    "intensity" INTEGER NOT NULL DEFAULT 1,
    "area_type" "LifeAreaType",
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "LifeReflectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source_ids" TEXT[],
    "area_type" "LifeAreaType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" "EnergyStateType" NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 3,
    "source_reflection_id" TEXT,
    "note" TEXT,
    "area_type" "LifeAreaType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meaning_signals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "area_type" "LifeAreaType",
    "related_memory_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meaning_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_balances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direction_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "intention" TEXT NOT NULL,
    "values" JSONB NOT NULL DEFAULT '[]',
    "quiet_wish" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "period" TEXT NOT NULL DEFAULT 'current',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direction_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiet_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intention" TEXT NOT NULL,
    "next_step" TEXT,
    "note" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "quiet_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_summaries" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "summary_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_themes" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_insights" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_cooldowns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cooldown_type" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 3,
    "source_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emotional_cooldowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "road_slug" TEXT NOT NULL,
    "road_title" TEXT NOT NULL,
    "road_icon" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "road_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_transitions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_road" TEXT NOT NULL,
    "to_road" TEXT NOT NULL,
    "reflection" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "themes" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasonal_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_landscapes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "seasonalAir" TEXT,
    "quietCurrents" JSONB NOT NULL DEFAULT '[]',
    "returningQuestions" JSONB NOT NULL DEFAULT '[]',
    "resonanceWeather" TEXT,
    "philosophyEchoes" JSONB NOT NULL DEFAULT '[]',
    "dominantTheme" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inner_landscapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "themes" JSONB NOT NULL DEFAULT '[]',
    "chapters" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambient_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_memory_ids" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "surfaced_at" TIMESTAMP(3) NOT NULL,
    "dismissed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambient_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resonance_patterns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "source_memory_ids" TEXT[],
    "evidence_ids" TEXT[],
    "first_observed_at" TIMESTAMP(3) NOT NULL,
    "observed_count" INTEGER NOT NULL DEFAULT 1,
    "last_observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resonance_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slow_feed_entries" (
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
    "surfaced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slow_feed_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "KnowledgeCardType" NOT NULL,
    "source" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "summary" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fingerprint" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "superseded_id" TEXT,
    "source_card_id" TEXT,
    "prompt_version" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_graph_edges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_content_id" TEXT NOT NULL,
    "to_content_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "philosophy_fragments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fragment" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "resonance_score" DOUBLE PRECISION NOT NULL,
    "related_theme" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "philosophy_fragments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "traits" JSONB NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_sources" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "context_version" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "memory_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "last_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "token_used" INTEGER,
    "cost_estimate" DOUBLE PRECISION,
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
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
    "metadata" JSONB DEFAULT '{}',
    "memory_state" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "tags" TEXT[],
    "ai_tags" TEXT[],
    "theme" "ThemeType",
    "content_type" TEXT,
    "reflection" TEXT,
    "embedding" vector(768),
    "embedding_model" TEXT,
    "embedding_dimensions" INTEGER,
    "ai_version" TEXT,
    "ai_processed_at" TIMESTAMP(3),
    "snapshot_url" TEXT,
    "meaningStatus" TEXT DEFAULT 'pending',
    "memory_road_id" TEXT,
    "last_viewed_at" TIMESTAMP(3),
    "context_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_jobs" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "snapshot_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snapshot_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meaning_jobs" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meaning_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_connections" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "context_type" "ContextType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_jobs" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_relations" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_links" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_resurfacings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_content_id" TEXT,
    "related_content_id" TEXT,
    "message" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "memory_resurfacings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rituals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quiet_question" TEXT NOT NULL,
    "ambient_reflection" TEXT NOT NULL,
    "returning_themes" JSONB NOT NULL,
    "philosophy_fragments" JSONB NOT NULL,
    "past_memories" JSONB NOT NULL,
    "audio_reflection_id" TEXT,
    "audio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_rituals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "themes" JSONB NOT NULL,
    "reflections" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "reflection" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "content_type" TEXT NOT NULL,
    "tags" TEXT[],
    "embedding" vector(768),
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_suggestions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_item_id" TEXT,
    "knowledge_content_id" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_item_id" TEXT,
    "memory_resonance_id" TEXT,
    "script" TEXT NOT NULL,
    "audio_url" TEXT,
    "voice_provider" TEXT,
    "voice_model" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reflection_snapshots" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "dominant_theme" "ReflectionTheme",
    "dominant_theme_confidence" DOUBLE PRECISION,
    "restoration_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growth_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "connection_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moment_count" INTEGER NOT NULL DEFAULT 0,
    "inspired_count" INTEGER NOT NULL DEFAULT 0,
    "trend_direction" INTEGER NOT NULL DEFAULT 0,
    "status" "SnapshotStatus" NOT NULL DEFAULT 'GENERATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_reflection_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wisdom_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "insightType" "WisdomInsightType" NOT NULL,
    "score" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wisdom_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "connection_id" UUID NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'external',
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "connection_id" UUID NOT NULL,
    "gmail_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "labels" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yui_reflections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "insights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "next_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yui_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "memory_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "suggested_time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "calendar_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "yui_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "goal_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "yui_notification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "delivered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'delivered',

    CONSTRAINT "yui_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE INDEX "system_role_assignments_user_id_idx" ON "system_role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "system_role_assignments_role_idx" ON "system_role_assignments"("role");

-- CreateIndex
CREATE UNIQUE INDEX "system_role_assignments_user_id_role_key" ON "system_role_assignments"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key" ON "permissions"("permission");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_id_key" ON "role_permissions"("role", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_keys_user_id_api_provider_key" ON "user_api_keys"("user_id", "api_provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_settings_user_id_key" ON "user_ai_settings"("user_id");

-- CreateIndex
CREATE INDEX "daily_logs_user_id_idx" ON "daily_logs"("user_id");

-- CreateIndex
CREATE INDEX "daily_logs_created_at_idx" ON "daily_logs"("created_at");

-- CreateIndex
CREATE INDEX "reflections_user_id_idx" ON "reflections"("user_id");

-- CreateIndex
CREATE INDEX "reflections_created_at_idx" ON "reflections"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contents_slug_key" ON "contents"("slug");

-- CreateIndex
CREATE INDEX "contents_created_by_idx" ON "contents"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "content_tags_tag_id_idx" ON "content_tags"("tag_id");

-- CreateIndex
CREATE INDEX "user_progress_content_id_idx" ON "user_progress"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_content_id_key" ON "user_progress"("user_id", "content_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "risk_reviews_user_id_idx" ON "risk_reviews"("user_id");

-- CreateIndex
CREATE INDEX "risk_reviews_status_idx" ON "risk_reviews"("status");

-- CreateIndex
CREATE INDEX "risk_reviews_assigned_to_idx" ON "risk_reviews"("assigned_to");

-- CreateIndex
CREATE INDEX "risk_reviews_risk_level_idx" ON "risk_reviews"("risk_level");

-- CreateIndex
CREATE INDEX "state_transitions_entity_type_entity_id_idx" ON "state_transitions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "state_transitions_entity_type_entity_id_created_at_idx" ON "state_transitions"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "state_transitions_actor_id_idx" ON "state_transitions"("actor_id");

-- CreateIndex
CREATE INDEX "state_transitions_created_at_idx" ON "state_transitions"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "audit_logs"("category");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_category_created_at_idx" ON "audit_logs"("category", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "roads_slug_key" ON "roads"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "road_prompts_road_id_key" ON "road_prompts"("road_id");

-- CreateIndex
CREATE INDEX "life_areas_user_id_idx" ON "life_areas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "life_areas_user_id_type_key" ON "life_areas"("user_id", "type");

-- CreateIndex
CREATE INDEX "habit_flows_user_id_status_idx" ON "habit_flows"("user_id", "status");

-- CreateIndex
CREATE INDEX "habit_flows_user_id_area_type_idx" ON "habit_flows"("user_id", "area_type");

-- CreateIndex
CREATE INDEX "life_reflections_user_id_type_idx" ON "life_reflections"("user_id", "type");

-- CreateIndex
CREATE INDEX "life_reflections_user_id_created_at_idx" ON "life_reflections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "energy_states_user_id_state_idx" ON "energy_states"("user_id", "state");

-- CreateIndex
CREATE INDEX "energy_states_user_id_created_at_idx" ON "energy_states"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "meaning_signals_user_id_signal_type_idx" ON "meaning_signals"("user_id", "signal_type");

-- CreateIndex
CREATE INDEX "meaning_signals_user_id_confidence_idx" ON "meaning_signals"("user_id", "confidence");

-- CreateIndex
CREATE INDEX "life_balances_user_id_created_at_idx" ON "life_balances"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "direction_reflections_user_id_period_idx" ON "direction_reflections"("user_id", "period");

-- CreateIndex
CREATE INDEX "direction_reflections_user_id_created_at_idx" ON "direction_reflections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "quiet_plans_user_id_idx" ON "quiet_plans"("user_id");

-- CreateIndex
CREATE INDEX "conversation_summaries_conversation_id_summary_type_idx" ON "conversation_summaries"("conversation_id", "summary_type");

-- CreateIndex
CREATE INDEX "conversation_themes_conversation_id_idx" ON "conversation_themes"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_insights_conversation_id_idx" ON "conversation_insights"("conversation_id");

-- CreateIndex
CREATE INDEX "emotional_cooldowns_user_id_cooldown_type_idx" ON "emotional_cooldowns"("user_id", "cooldown_type");

-- CreateIndex
CREATE INDEX "emotional_cooldowns_user_id_expires_at_idx" ON "emotional_cooldowns"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "road_histories_user_id_idx" ON "road_histories"("user_id");

-- CreateIndex
CREATE INDEX "road_transitions_user_id_idx" ON "road_transitions"("user_id");

-- CreateIndex
CREATE INDEX "seasonal_summaries_user_id_idx" ON "seasonal_summaries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_summaries_user_id_period_key" ON "seasonal_summaries"("user_id", "period");

-- CreateIndex
CREATE INDEX "inner_landscapes_user_id_idx" ON "inner_landscapes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "inner_landscapes_user_id_period_key" ON "inner_landscapes"("user_id", "period");

-- CreateIndex
CREATE INDEX "legacy_snapshots_user_id_idx" ON "legacy_snapshots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_snapshots_user_id_period_key" ON "legacy_snapshots"("user_id", "period");

-- CreateIndex
CREATE INDEX "ambient_insights_user_id_type_idx" ON "ambient_insights"("user_id", "type");

-- CreateIndex
CREATE INDEX "ambient_insights_user_id_surfaced_at_idx" ON "ambient_insights"("user_id", "surfaced_at");

-- CreateIndex
CREATE INDEX "ambient_insights_user_id_confidence_idx" ON "ambient_insights"("user_id", "confidence");

-- CreateIndex
CREATE INDEX "resonance_patterns_user_id_pattern_type_idx" ON "resonance_patterns"("user_id", "pattern_type");

-- CreateIndex
CREATE INDEX "resonance_patterns_user_id_confidence_idx" ON "resonance_patterns"("user_id", "confidence");

-- CreateIndex
CREATE UNIQUE INDEX "resonance_patterns_user_id_pattern_type_first_observed_at_key" ON "resonance_patterns"("user_id", "pattern_type", "first_observed_at");

-- CreateIndex
CREATE INDEX "slow_feed_entries_user_id_is_read_created_at_idx" ON "slow_feed_entries"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "slow_feed_entries_user_id_priority_surfaced_at_idx" ON "slow_feed_entries"("user_id", "priority", "surfaced_at");

-- CreateIndex
CREATE INDEX "slow_feed_entries_user_id_entry_type_idx" ON "slow_feed_entries"("user_id", "entry_type");

-- CreateIndex
CREATE INDEX "knowledge_cards_user_id_idx" ON "knowledge_cards"("user_id");

-- CreateIndex
CREATE INDEX "knowledge_cards_user_id_type_idx" ON "knowledge_cards"("user_id", "type");

-- CreateIndex
CREATE INDEX "knowledge_cards_user_id_created_at_idx" ON "knowledge_cards"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_memories_fingerprint_key" ON "user_memories"("fingerprint");

-- CreateIndex
CREATE INDEX "user_memories_user_id_type_idx" ON "user_memories"("user_id", "type");

-- CreateIndex
CREATE INDEX "user_memories_user_id_confidence_idx" ON "user_memories"("user_id", "confidence");

-- CreateIndex
CREATE INDEX "user_memories_user_id_type_confidence_idx" ON "user_memories"("user_id", "type", "confidence");

-- CreateIndex
CREATE INDEX "user_memories_fingerprint_idx" ON "user_memories"("fingerprint");

-- CreateIndex
CREATE INDEX "memory_graph_edges_user_id_idx" ON "memory_graph_edges"("user_id");

-- CreateIndex
CREATE INDEX "memory_graph_edges_from_content_id_idx" ON "memory_graph_edges"("from_content_id");

-- CreateIndex
CREATE INDEX "memory_graph_edges_to_content_id_idx" ON "memory_graph_edges"("to_content_id");

-- CreateIndex
CREATE INDEX "memory_graph_edges_user_id_edge_type_idx" ON "memory_graph_edges"("user_id", "edge_type");

-- CreateIndex
CREATE UNIQUE INDEX "memory_graph_edges_user_id_from_content_id_to_content_id_ed_key" ON "memory_graph_edges"("user_id", "from_content_id", "to_content_id", "edge_type");

-- CreateIndex
CREATE INDEX "philosophy_fragments_user_id_idx" ON "philosophy_fragments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "philosophy_fragments_user_id_fragment_key" ON "philosophy_fragments"("user_id", "fragment");

-- CreateIndex
CREATE INDEX "identity_snapshots_user_id_period_idx" ON "identity_snapshots"("user_id", "period");

-- CreateIndex
CREATE INDEX "identity_snapshots_user_id_start_date_idx" ON "identity_snapshots"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "memory_sources_card_id_idx" ON "memory_sources"("card_id");

-- CreateIndex
CREATE INDEX "memory_sources_memory_id_idx" ON "memory_sources"("memory_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_sources_memory_id_card_id_key" ON "memory_sources"("memory_id", "card_id");

-- CreateIndex
CREATE INDEX "companion_conversations_user_id_idx" ON "companion_conversations"("user_id");

-- CreateIndex
CREATE INDEX "companion_conversations_user_id_created_at_idx" ON "companion_conversations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "companion_messages_conversation_id_idx" ON "companion_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "companion_messages_conversation_id_created_at_idx" ON "companion_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_user_id_status_idx" ON "ai_jobs"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_jobs_status_priority_created_at_idx" ON "ai_jobs"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_status_created_at_idx" ON "ai_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "content_items_user_id_idx" ON "content_items"("user_id");

-- CreateIndex
CREATE INDEX "content_items_created_at_idx" ON "content_items"("created_at");

-- CreateIndex
CREATE INDEX "memory_connections_source_id_idx" ON "memory_connections"("source_id");

-- CreateIndex
CREATE INDEX "memory_connections_target_id_idx" ON "memory_connections"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_connections_source_id_target_id_key" ON "memory_connections"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "connection_jobs_content_item_id_idx" ON "connection_jobs"("content_item_id");

-- CreateIndex
CREATE INDEX "connection_jobs_status_idx" ON "connection_jobs"("status");

-- CreateIndex
CREATE INDEX "memory_relations_source_id_idx" ON "memory_relations"("source_id");

-- CreateIndex
CREATE INDEX "memory_relations_target_id_idx" ON "memory_relations"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_relations_source_id_target_id_key" ON "memory_relations"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "memory_links_source_id_idx" ON "memory_links"("source_id");

-- CreateIndex
CREATE INDEX "memory_links_target_id_idx" ON "memory_links"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_links_source_id_target_id_key" ON "memory_links"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "memory_resurfacings_user_id_idx" ON "memory_resurfacings"("user_id");

-- CreateIndex
CREATE INDEX "memory_resurfacings_user_id_created_at_idx" ON "memory_resurfacings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "daily_rituals_user_id_date_idx" ON "daily_rituals"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_rituals_user_id_date_key" ON "daily_rituals"("user_id", "date");

-- CreateIndex
CREATE INDEX "memory_snapshots_user_id_idx" ON "memory_snapshots"("user_id");

-- CreateIndex
CREATE INDEX "memory_snapshots_user_id_period_idx" ON "memory_snapshots"("user_id", "period");

-- CreateIndex
CREATE INDEX "weekly_reflections_user_id_idx" ON "weekly_reflections"("user_id");

-- CreateIndex
CREATE INDEX "weekly_reflections_user_id_created_at_idx" ON "weekly_reflections"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reflections_user_id_week_start_key" ON "weekly_reflections"("user_id", "week_start");

-- CreateIndex
CREATE INDEX "learning_suggestions_user_id_idx" ON "learning_suggestions"("user_id");

-- CreateIndex
CREATE INDEX "learning_suggestions_knowledge_content_id_idx" ON "learning_suggestions"("knowledge_content_id");

-- CreateIndex
CREATE INDEX "audio_reflections_user_id_idx" ON "audio_reflections"("user_id");

-- CreateIndex
CREATE INDEX "audio_reflections_status_idx" ON "audio_reflections"("status");

-- CreateIndex
CREATE INDEX "community_reflection_snapshots_created_at_idx" ON "community_reflection_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "community_reflection_snapshots_status_idx" ON "community_reflection_snapshots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "community_reflection_snapshots_period_start_period_end_key" ON "community_reflection_snapshots"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "wisdom_insights_user_id_idx" ON "wisdom_insights"("user_id");

-- CreateIndex
CREATE INDEX "wisdom_insights_created_at_idx" ON "wisdom_insights"("created_at");

-- CreateIndex
CREATE INDEX "connections_user_id_idx" ON "connections"("user_id");

-- CreateIndex
CREATE INDEX "connections_provider_idx" ON "connections"("provider");

-- CreateIndex
CREATE INDEX "connections_user_id_provider_idx" ON "connections"("user_id", "provider");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_connection_id_idx" ON "calendar_events"("connection_id");

-- CreateIndex
CREATE INDEX "calendar_events_start_at_idx" ON "calendar_events"("start_at");

-- CreateIndex
CREATE INDEX "calendar_events_external_id_idx" ON "calendar_events"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "gmail_messages_gmail_id_key" ON "gmail_messages"("gmail_id");

-- CreateIndex
CREATE INDEX "gmail_messages_user_id_idx" ON "gmail_messages"("user_id");

-- CreateIndex
CREATE INDEX "gmail_messages_connection_id_idx" ON "gmail_messages"("connection_id");

-- CreateIndex
CREATE INDEX "gmail_messages_received_at_idx" ON "gmail_messages"("received_at");

-- CreateIndex
CREATE INDEX "gmail_messages_thread_id_idx" ON "gmail_messages"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "yui_profiles_user_id_key" ON "yui_profiles"("user_id");

-- CreateIndex
CREATE INDEX "memories_user_id_created_at_idx" ON "memories"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "conversations_user_id_created_at_idx" ON "conversations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "yui_reflections_user_id_created_at_idx" ON "yui_reflections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "memory_candidates_user_id_status_created_at_idx" ON "memory_candidates"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "memory_candidates_conversation_id_idx" ON "memory_candidates"("conversation_id");

-- CreateIndex
CREATE INDEX "decisions_user_id_created_at_idx" ON "decisions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "yui_daily_briefs_user_id_generated_at_idx" ON "yui_daily_briefs"("user_id", "generated_at");

-- CreateIndex
CREATE INDEX "yui_daily_briefs_context_hash_idx" ON "yui_daily_briefs"("context_hash");

-- CreateIndex
CREATE UNIQUE INDEX "yui_daily_briefs_user_id_context_hash_key" ON "yui_daily_briefs"("user_id", "context_hash");

-- CreateIndex
CREATE INDEX "events_user_id_occurred_at_idx" ON "events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "events_user_id_created_at_idx" ON "events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "events_event_type_idx" ON "events"("event_type");

-- CreateIndex
CREATE INDEX "goals_user_id_created_at_idx" ON "goals"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "suggested_time_blocks_user_id_start_at_idx" ON "suggested_time_blocks"("user_id", "start_at");

-- CreateIndex
CREATE INDEX "suggested_time_blocks_goal_id_idx" ON "suggested_time_blocks"("goal_id");

-- CreateIndex
CREATE INDEX "suggested_time_blocks_user_id_status_idx" ON "suggested_time_blocks"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_actions_time_block_id_key" ON "calendar_actions"("time_block_id");

-- CreateIndex
CREATE INDEX "calendar_actions_user_id_status_idx" ON "calendar_actions"("user_id", "status");

-- CreateIndex
CREATE INDEX "calendar_actions_user_id_created_at_idx" ON "calendar_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "yui_recommendations_user_id_status_created_at_idx" ON "yui_recommendations"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "yui_recommendations_user_id_type_created_at_idx" ON "yui_recommendations"("user_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "yui_recommendations_related_goal_id_idx" ON "yui_recommendations"("related_goal_id");

-- CreateIndex
CREATE INDEX "milestones_user_id_goal_id_created_at_idx" ON "milestones"("user_id", "goal_id", "created_at");

-- CreateIndex
CREATE INDEX "milestones_goal_id_idx" ON "milestones"("goal_id");

-- CreateIndex
CREATE UNIQUE INDEX "yui_notification_settings_user_id_key" ON "yui_notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "yui_notification_logs_user_id_delivered_at_idx" ON "yui_notification_logs"("user_id", "delivered_at");

-- CreateIndex
CREATE INDEX "yui_memory_profiles_user_id_updated_at_idx" ON "yui_memory_profiles"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "yui_memory_profiles_user_id_memory_key_key" ON "yui_memory_profiles"("user_id", "memory_key");

-- AddForeignKey
ALTER TABLE "system_role_assignments" ADD CONSTRAINT "system_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_contents" ADD CONSTRAINT "external_contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_prompts" ADD CONSTRAINT "road_prompts_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_areas" ADD CONSTRAINT "life_areas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_flows" ADD CONSTRAINT "habit_flows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_reflections" ADD CONSTRAINT "life_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_states" ADD CONSTRAINT "energy_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meaning_signals" ADD CONSTRAINT "meaning_signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_balances" ADD CONSTRAINT "life_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_reflections" ADD CONSTRAINT "direction_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiet_plans" ADD CONSTRAINT "quiet_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_summaries" ADD CONSTRAINT "conversation_summaries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "companion_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_themes" ADD CONSTRAINT "conversation_themes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "companion_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_insights" ADD CONSTRAINT "conversation_insights_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "companion_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_cooldowns" ADD CONSTRAINT "emotional_cooldowns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_histories" ADD CONSTRAINT "road_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_transitions" ADD CONSTRAINT "road_transitions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_summaries" ADD CONSTRAINT "seasonal_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inner_landscapes" ADD CONSTRAINT "inner_landscapes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_snapshots" ADD CONSTRAINT "legacy_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambient_insights" ADD CONSTRAINT "ambient_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resonance_patterns" ADD CONSTRAINT "resonance_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slow_feed_entries" ADD CONSTRAINT "slow_feed_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_cards" ADD CONSTRAINT "knowledge_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_source_card_id_fkey" FOREIGN KEY ("source_card_id") REFERENCES "knowledge_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_sources" ADD CONSTRAINT "memory_sources_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "user_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_sources" ADD CONSTRAINT "memory_sources_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "knowledge_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_conversations" ADD CONSTRAINT "companion_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_messages" ADD CONSTRAINT "companion_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "companion_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_jobs" ADD CONSTRAINT "snapshot_jobs_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meaning_jobs" ADD CONSTRAINT "meaning_jobs_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_connections" ADD CONSTRAINT "memory_connections_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_connections" ADD CONSTRAINT "memory_connections_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_jobs" ADD CONSTRAINT "connection_jobs_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_relations" ADD CONSTRAINT "memory_relations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_relations" ADD CONSTRAINT "memory_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_resurfacings" ADD CONSTRAINT "memory_resurfacings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_resurfacings" ADD CONSTRAINT "memory_resurfacings_source_content_id_fkey" FOREIGN KEY ("source_content_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_resurfacings" ADD CONSTRAINT "memory_resurfacings_related_content_id_fkey" FOREIGN KEY ("related_content_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_insights" ADD CONSTRAINT "wisdom_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_messages" ADD CONSTRAINT "gmail_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_messages" ADD CONSTRAINT "gmail_messages_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_profiles" ADD CONSTRAINT "yui_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_reflections" ADD CONSTRAINT "yui_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_daily_briefs" ADD CONSTRAINT "yui_daily_briefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggested_time_blocks" ADD CONSTRAINT "suggested_time_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggested_time_blocks" ADD CONSTRAINT "suggested_time_blocks_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_time_block_id_fkey" FOREIGN KEY ("time_block_id") REFERENCES "suggested_time_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_related_goal_id_fkey" FOREIGN KEY ("related_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_notification_settings" ADD CONSTRAINT "yui_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_notification_logs" ADD CONSTRAINT "yui_notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yui_memory_profiles" ADD CONSTRAINT "yui_memory_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Canonical YUI domain constraints. These are intentionally database-level
-- guarantees beyond what Prisma's schema language can currently express.
ALTER TABLE "memories" ADD CONSTRAINT "memories_tags_not_null_check" CHECK ("tags" IS NOT NULL);
ALTER TABLE "yui_reflections" ADD CONSTRAINT "yui_reflections_arrays_not_null_check" CHECK ("insights" IS NOT NULL AND "next_actions" IS NOT NULL);
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected'));
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_confidence_check" CHECK ("confidence" BETWEEN 0 AND 100);
ALTER TABLE "goals" ADD CONSTRAINT "goals_status_check" CHECK ("status" IN ('active', 'paused', 'completed'));
ALTER TABLE "goals" ADD CONSTRAINT "goals_progress_check" CHECK ("progress" BETWEEN 0 AND 100);
ALTER TABLE "suggested_time_blocks" ADD CONSTRAINT "suggested_time_blocks_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected', 'created'));
ALTER TABLE "suggested_time_blocks" ADD CONSTRAINT "suggested_time_blocks_time_check" CHECK ("end_at" > "start_at");
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_status_check" CHECK ("status" IN ('pending', 'approved', 'scheduled', 'rejected'));
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_provider_check" CHECK ("provider" IN ('google_calendar', 'apple_calendar', 'manual'));
ALTER TABLE "calendar_actions" ADD CONSTRAINT "calendar_actions_time_check" CHECK ("end_at" > "start_at");
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_status_check" CHECK ("status" IN ('pending', 'accepted', 'rejected', 'completed'));
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_type_check" CHECK ("type" IN ('time_block', 'decision', 'task', 'reflection'));
ALTER TABLE "yui_recommendations" ADD CONSTRAINT "yui_recommendations_score_check" CHECK ("score" BETWEEN 0 AND 100);
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_status_check" CHECK ("status" IN ('pending', 'completed'));
ALTER TABLE "yui_notification_logs" ADD CONSTRAINT "yui_notification_logs_type_check" CHECK ("type" IN ('morning', 'evening'));

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

-- YUI is server-only. The platform's service role receives scoped DML while
-- browser roles receive nothing. No RLS policies are created because user_id
-- contains a NextAuth/Prisma CUID, not a Supabase Auth UUID.
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
