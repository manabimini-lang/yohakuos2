-- Preserve the purpose in effect when a YUI record is created.
-- Existing records intentionally remain unassigned: we do not rewrite history.

ALTER TABLE "conversations"
  ADD COLUMN "goal_id" UUID REFERENCES "goals"("id") ON DELETE SET NULL,
  ADD COLUMN "goal_association_source" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN "goal_association_confidence" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "conversations_goal_association_confidence_check"
    CHECK ("goal_association_confidence" BETWEEN 0 AND 100);

ALTER TABLE "yui_reflections"
  ADD COLUMN "goal_id" UUID REFERENCES "goals"("id") ON DELETE SET NULL,
  ADD COLUMN "goal_association_source" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN "goal_association_confidence" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "yui_reflections_goal_association_confidence_check"
    CHECK ("goal_association_confidence" BETWEEN 0 AND 100);

ALTER TABLE "memory_candidates"
  ADD COLUMN "goal_id" UUID REFERENCES "goals"("id") ON DELETE SET NULL,
  ADD COLUMN "goal_association_source" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN "goal_association_confidence" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "memory_candidates_goal_association_confidence_check"
    CHECK ("goal_association_confidence" BETWEEN 0 AND 100);

ALTER TABLE "memories"
  ADD COLUMN "goal_id" UUID REFERENCES "goals"("id") ON DELETE SET NULL,
  ADD COLUMN "goal_association_source" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN "goal_association_confidence" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "memories_goal_association_confidence_check"
    CHECK ("goal_association_confidence" BETWEEN 0 AND 100);

CREATE INDEX "conversations_user_id_goal_id_created_at_idx" ON "conversations"("user_id", "goal_id", "created_at");
CREATE INDEX "yui_reflections_user_id_goal_id_created_at_idx" ON "yui_reflections"("user_id", "goal_id", "created_at");
CREATE INDEX "memory_candidates_user_id_goal_id_created_at_idx" ON "memory_candidates"("user_id", "goal_id", "created_at");
CREATE INDEX "memories_user_id_goal_id_created_at_idx" ON "memories"("user_id", "goal_id", "created_at");
