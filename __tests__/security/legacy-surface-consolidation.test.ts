import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("legacy memory APIs derive ownership from the authenticated session", () => {
  for (const path of ["app/api/memory/route.ts", "app/api/memory/graph/route.ts", "app/api/context/route.ts"]) {
    const route = source(path);
    assert.match(route, /await auth\(\)/);
    assert.match(route, /session\.user\.id/);
    assert.doesNotMatch(route, /searchParams\.get\(['"]userId['"]\)/);
  }

  const memoryRoute = source("app/api/memory/route.ts");
  assert.match(memoryRoute, /where: \{ id: memoryId, userId: session\.user\.id \}/);
});

test("unfinished and duplicate routes redirect into the current product", () => {
  const config = source("next.config.js");
  for (const route of [
    "/memory/timeline",
    "/memory/graph",
    "/memory/resonance",
    "/member/ai",
    "/log",
    "/review",
    "/dashboard",
    "/content/share",
  ]) {
    assert.ok(config.includes(`source: "${route}"`), `${route} must be consolidated`);
  }
});

test("new onboarding records are saved to YUI, not browser-only storage", () => {
  const onboarding = source("components/onboarding/onboarding-client.tsx");
  assert.match(onboarding, /fetch\("\/api\/yui\/memories"/);
  assert.doesNotMatch(onboarding, /addPersonalLog/);
});

test("legacy browser records require an explicit import action", () => {
  const migration = source("components/yui/LegacyLocalLogMigration.tsx");
  assert.match(migration, /onClick=\{\(\) => void migrate\(\)\}/);
  assert.match(migration, /retaining the originals/);
  assert.doesNotMatch(migration, /deletePersonalLog/);
});

test("the audio archive has a clear name and an inbound YUI link", () => {
  assert.match(source("app/reflections/page.tsx"), /音声ブリーフ履歴/);
  assert.match(source("components/yui/BriefAudio.tsx"), /href="\/reflections"/);
});
