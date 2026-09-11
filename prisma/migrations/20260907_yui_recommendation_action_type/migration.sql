-- YUI Chat stores executable goal and milestone suggestions as action records.
-- Keep the database constraint aligned with the application-level recommendation type.
ALTER TABLE "yui_recommendations"
  DROP CONSTRAINT IF EXISTS "yui_recommendations_type_check";

ALTER TABLE "yui_recommendations"
  ADD CONSTRAINT "yui_recommendations_type_check"
  CHECK ("type" IN ('time_block', 'decision', 'task', 'reflection', 'action'));
