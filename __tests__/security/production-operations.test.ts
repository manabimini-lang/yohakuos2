import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("deployments validate production configuration before building", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  );
  assert.match(pkg.scripts["vercel-build"], /^npm run env:check/);
  assert.match(pkg.scripts.test, /__tests__\/security\/\*\.test\.ts/);
  assert.match(pkg.scripts.test, /__tests__\/ux\/\*\.test\.ts/);
});

test("the public health check reports no secrets or provider details", () => {
  const route = readFileSync(
    new URL("../../app/api/health/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /SELECT 1/);
  assert.match(route, /status: "unavailable"/);
  assert.doesNotMatch(route, /process\.env|DATABASE_URL|CRON_SECRET/);
});
