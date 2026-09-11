-- YOHAKU Activity OS: knowledge circulation, newsletter, product learning and reports
CREATE TABLE "admin_insights" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "theme" TEXT,
  "source_type" TEXT NOT NULL,
  "source_id" TEXT,
  "audience" TEXT,
  "usage_purposes" JSONB NOT NULL DEFAULT '[]',
  "consent_status" TEXT NOT NULL DEFAULT 'aggregate_only',
  "anonymization_status" TEXT NOT NULL DEFAULT 'pending',
  "minimum_group_size" INTEGER NOT NULL DEFAULT 5,
  "observed_count" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "review_notes" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_insights_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_insights_status_created_at_idx" ON "admin_insights"("status", "created_at");
CREATE INDEX "admin_insights_source_type_source_id_idx" ON "admin_insights"("source_type", "source_id");
CREATE INDEX "admin_insights_anonymization_status_idx" ON "admin_insights"("anonymization_status");

CREATE TABLE "newsletter_campaigns" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "purpose" TEXT,
  "segment" TEXT NOT NULL DEFAULT 'all',
  "subject" TEXT,
  "body" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "review_notes" TEXT,
  "scheduled_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "open_rate" DOUBLE PRECISION,
  "click_rate" DOUBLE PRECISION,
  "return_rate" DOUBLE PRECISION,
  "unsubscribe_rate" DOUBLE PRECISION,
  "learnings" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "newsletter_campaigns_status_scheduled_at_idx" ON "newsletter_campaigns"("status", "scheduled_at");
CREATE INDEX "newsletter_campaigns_segment_idx" ON "newsletter_campaigns"("segment");

CREATE TABLE "product_hypotheses" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "problem" TEXT NOT NULL,
  "hypothesis" TEXT NOT NULL,
  "evidence" TEXT,
  "target_segment" TEXT,
  "success_metric" TEXT,
  "status" TEXT NOT NULL DEFAULT 'backlog',
  "result" TEXT,
  "owner_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_hypotheses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_hypotheses_status_updated_at_idx" ON "product_hypotheses"("status", "updated_at");
CREATE INDEX "product_hypotheses_owner_id_idx" ON "product_hypotheses"("owner_id");

CREATE TABLE "activity_reports" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "metrics" JSONB NOT NULL DEFAULT '{}',
  "insight_ids" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "review_notes" TEXT,
  "published_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "activity_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "activity_reports_status_period_end_idx" ON "activity_reports"("status", "period_end");
