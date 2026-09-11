import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("BYOK credentials are stored independently by provider", () => {
  const helper = readFileSync(new URL("../../lib/ai/user-api-keys.ts", import.meta.url), "utf8");
  assert.match(helper, /userId_apiProvider/);
  assert.match(helper, /apiProvider: provider/);
  assert.match(helper, /userApiKey\.upsert/);
});

test("switching to managed AI keeps provider-specific credentials", () => {
  const action = readFileSync(new URL("../../app/actions/ai-settings.ts", import.meta.url), "utf8");
  assert.match(action, /saveUserApiKey\(userId, keyProvider/);
  assert.doesNotMatch(action, /userApiKey\.delete/);
});

test("the database enforces one key per user and provider", () => {
  const migration = readFileSync(new URL("../../prisma/migrations/20260910_provider_specific_api_keys/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS/);
  assert.match(migration, /"user_id", "api_provider"/);
});
