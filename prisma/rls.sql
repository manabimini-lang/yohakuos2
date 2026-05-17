-- 1. Enable Row Level Security
ALTER TABLE "user_api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reflections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for NextAuth usage
-- Note: NextAuth uses a server-side pool and standard Postgres connection.
-- To properly use these policies, the application MUST run:
--   SET LOCAL app.current_user_id = 'user_id_here';
-- before querying. If that is not set, RLS will deny access unless the role is superuser (postgres).
-- Prisma connects as 'postgres', which BYPASSES RLS BY DEFAULT. 
-- So these policies are safe to add, they won't break Prisma unless Prisma is forced to respect RLS.

DROP POLICY IF EXISTS "user_api_keys_policy" ON "user_api_keys";
CREATE POLICY "user_api_keys_policy" ON "user_api_keys"
  FOR ALL USING ("user_id" = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "daily_logs_policy" ON "daily_logs";
CREATE POLICY "daily_logs_policy" ON "daily_logs"
  FOR ALL USING ("user_id" = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "reflections_policy" ON "reflections";
CREATE POLICY "reflections_policy" ON "reflections"
  FOR ALL USING ("user_id" = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "subscriptions_policy" ON "subscriptions";
CREATE POLICY "subscriptions_policy" ON "subscriptions"
  FOR SELECT USING ("user_id" = current_setting('app.current_user_id', true));
