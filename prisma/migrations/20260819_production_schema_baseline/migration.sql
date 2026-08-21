-- Sprint 60 baseline for tables that exist in Production but were never captured by migration history.
-- Production must resolve this migration as applied only after matching the audited fingerprints.
-- Empty environments execute it normally. Existing Production tables are never altered by this file.

BEGIN;

CREATE TYPE "ContextType" AS ENUM ('LEARNING', 'CONTINUITY', 'CHALLENGE', 'CREATION', 'EXPLORATION', 'HEALTH', 'FAMILY', 'WORK', 'SHARING', 'REFLECTION');
CREATE TYPE "ReflectionTheme" AS ENUM ('GROWTH', 'RESTORATION', 'CONNECTION', 'EXPLORATION', 'STABILITY', 'CREATIVITY');
CREATE TYPE "SnapshotStatus" AS ENUM ('GENERATED', 'EMPTY_WEEK', 'AI_FAILED');
CREATE TYPE "WisdomInsightType" AS ENUM ('ALIGNMENT', 'DIVERGENCE', 'EMERGING_PATTERN', 'COMMUNITY_SIGNAL');

CREATE TABLE "connections" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "provider" text NOT NULL,
    "status" text NOT NULL,
    "permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "connected_at" timestamp(3) without time zone,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "connections_pkey" PRIMARY KEY (id)
);

CREATE TABLE "calendar_events" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "connection_id" uuid NOT NULL,
    "source" text DEFAULT 'external'::text NOT NULL,
    "provider" text NOT NULL,
    "external_id" text NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "start_at" timestamp(3) without time zone NOT NULL,
    "end_at" timestamp(3) without time zone NOT NULL,
    "location" text,
    "status" text NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "calendar_events_pkey" PRIMARY KEY (id)
);

CREATE TABLE "gmail_messages" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "connection_id" uuid NOT NULL,
    "gmail_id" text NOT NULL,
    "thread_id" text NOT NULL,
    "subject" text NOT NULL,
    "from_email" text NOT NULL,
    "to_email" text NOT NULL,
    "snippet" text NOT NULL,
    "received_at" timestamp(3) without time zone NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "gmail_messages_pkey" PRIMARY KEY (id)
);

CREATE TABLE "community_reflection_snapshots" (
    "id" text NOT NULL,
    "period_start" timestamp(3) without time zone NOT NULL,
    "period_end" timestamp(3) without time zone NOT NULL,
    "summary" text NOT NULL,
    "dominant_theme" "ReflectionTheme",
    "dominant_theme_confidence" double precision,
    "restoration_score" double precision DEFAULT 0 NOT NULL,
    "growth_score" double precision DEFAULT 0 NOT NULL,
    "connection_score" double precision DEFAULT 0 NOT NULL,
    "moment_count" integer DEFAULT 0 NOT NULL,
    "inspired_count" integer DEFAULT 0 NOT NULL,
    "trend_direction" integer DEFAULT 0 NOT NULL,
    "status" "SnapshotStatus" DEFAULT 'GENERATED'::"SnapshotStatus" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "community_reflection_snapshots_pkey" PRIMARY KEY (id)
);

CREATE TABLE "connection_jobs" (
    "id" text NOT NULL,
    "content_item_id" text NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "connection_jobs_pkey" PRIMARY KEY (id)
);

CREATE TABLE "meaning_jobs" (
    "id" text NOT NULL,
    "content_item_id" text NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "meaning_jobs_pkey" PRIMARY KEY (id)
);

CREATE TABLE "memory_connections" (
    "id" text NOT NULL,
    "source_id" text NOT NULL,
    "target_id" text NOT NULL,
    "score" double precision NOT NULL,
    "reason" text,
    "context_type" "ContextType",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "memory_connections_pkey" PRIMARY KEY (id)
);

CREATE TABLE "memory_links" (
    "id" text NOT NULL,
    "source_id" text NOT NULL,
    "target_id" text NOT NULL,
    "similarity" double precision NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "memory_links_pkey" PRIMARY KEY (id)
);

CREATE TABLE "memory_relations" (
    "id" text NOT NULL,
    "source_id" text NOT NULL,
    "target_id" text NOT NULL,
    "score" double precision NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "memory_relations_pkey" PRIMARY KEY (id)
);

CREATE TABLE "wisdom_insights" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "insightType" "WisdomInsightType" NOT NULL,
    "score" double precision,
    "metadata" jsonb,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "wisdom_insights_pkey" PRIMARY KEY (id)
);

CREATE INDEX connections_provider_idx ON public.connections USING btree (provider);
CREATE INDEX connections_user_id_idx ON public.connections USING btree (user_id);
CREATE INDEX connections_user_id_provider_idx ON public.connections USING btree (user_id, provider);
CREATE INDEX calendar_events_connection_id_idx ON public.calendar_events USING btree (connection_id);
CREATE INDEX calendar_events_external_id_idx ON public.calendar_events USING btree (external_id);
CREATE INDEX calendar_events_start_at_idx ON public.calendar_events USING btree (start_at);
CREATE INDEX calendar_events_user_id_idx ON public.calendar_events USING btree (user_id);
CREATE INDEX gmail_messages_connection_id_idx ON public.gmail_messages USING btree (connection_id);
CREATE UNIQUE INDEX gmail_messages_gmail_id_key ON public.gmail_messages USING btree (gmail_id);
CREATE INDEX gmail_messages_received_at_idx ON public.gmail_messages USING btree (received_at);
CREATE INDEX gmail_messages_thread_id_idx ON public.gmail_messages USING btree (thread_id);
CREATE INDEX gmail_messages_user_id_idx ON public.gmail_messages USING btree (user_id);
CREATE INDEX community_reflection_snapshots_created_at_idx ON public.community_reflection_snapshots USING btree (created_at);
CREATE UNIQUE INDEX community_reflection_snapshots_period_start_period_end_key ON public.community_reflection_snapshots USING btree (period_start, period_end);
CREATE INDEX community_reflection_snapshots_status_idx ON public.community_reflection_snapshots USING btree (status);
CREATE INDEX connection_jobs_content_item_id_idx ON public.connection_jobs USING btree (content_item_id);
CREATE INDEX connection_jobs_status_idx ON public.connection_jobs USING btree (status);
CREATE INDEX memory_connections_source_id_idx ON public.memory_connections USING btree (source_id);
CREATE UNIQUE INDEX memory_connections_source_id_target_id_key ON public.memory_connections USING btree (source_id, target_id);
CREATE INDEX memory_connections_target_id_idx ON public.memory_connections USING btree (target_id);
CREATE INDEX memory_links_source_id_idx ON public.memory_links USING btree (source_id);
CREATE UNIQUE INDEX memory_links_source_id_target_id_key ON public.memory_links USING btree (source_id, target_id);
CREATE INDEX memory_links_target_id_idx ON public.memory_links USING btree (target_id);
CREATE INDEX memory_relations_source_id_idx ON public.memory_relations USING btree (source_id);
CREATE UNIQUE INDEX memory_relations_source_id_target_id_key ON public.memory_relations USING btree (source_id, target_id);
CREATE INDEX memory_relations_target_id_idx ON public.memory_relations USING btree (target_id);
CREATE INDEX wisdom_insights_created_at_idx ON public.wisdom_insights USING btree (created_at);
CREATE INDEX wisdom_insights_user_id_idx ON public.wisdom_insights USING btree (user_id);

ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_connection_id_fkey" FOREIGN KEY (connection_id) REFERENCES connections(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "gmail_messages" ADD CONSTRAINT "gmail_messages_connection_id_fkey" FOREIGN KEY (connection_id) REFERENCES connections(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "gmail_messages" ADD CONSTRAINT "gmail_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "connection_jobs" ADD CONSTRAINT "connection_jobs_content_item_id_fkey" FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "meaning_jobs" ADD CONSTRAINT "meaning_jobs_content_item_id_fkey" FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "memory_connections" ADD CONSTRAINT "memory_connections_source_id_fkey" FOREIGN KEY (source_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "memory_connections" ADD CONSTRAINT "memory_connections_target_id_fkey" FOREIGN KEY (target_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_source_id_fkey" FOREIGN KEY (source_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_target_id_fkey" FOREIGN KEY (target_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "memory_relations" ADD CONSTRAINT "memory_relations_source_id_fkey" FOREIGN KEY (source_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "memory_relations" ADD CONSTRAINT "memory_relations_target_id_fkey" FOREIGN KEY (target_id) REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "wisdom_insights" ADD CONSTRAINT "wisdom_insights_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;

REVOKE ALL PRIVILEGES ON TABLE "connections", "calendar_events", "gmail_messages" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "connections", "calendar_events", "gmail_messages" TO service_role;

ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gmail_messages" ENABLE ROW LEVEL SECURITY;

-- No auth.uid() policies are created: these tables are server-only and user_id stores a NextAuth CUID.

COMMIT;
