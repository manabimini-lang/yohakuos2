-- Each user can retain one encrypted key per AI provider and switch providers
-- without replacing the other credential.
CREATE UNIQUE INDEX IF NOT EXISTS "user_api_keys_user_id_api_provider_key"
ON "user_api_keys"("user_id", "api_provider");
