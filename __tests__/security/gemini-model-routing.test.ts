import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ECONOMY_GEMINI_MODEL,
  resolveGeminiModelName,
  STANDARD_GEMINI_MODEL,
} from "../../lib/ai/gemini-model-routing.ts";
import { ECONOMY_GROQ_MODEL, resolveGroqModelName, STANDARD_GROQ_MODEL } from "../../lib/ai/groq-model-routing.ts";

test("lightweight AI work defaults to Flash-Lite", () => {
  assert.equal(resolveGeminiModelName(), ECONOMY_GEMINI_MODEL);
  assert.equal(resolveGeminiModelName(undefined, "economy"), "gemini-2.5-flash-lite");
});

test("user-facing conversations and important reflections use Flash", () => {
  assert.equal(resolveGeminiModelName(undefined, "standard"), STANDARD_GEMINI_MODEL);
  assert.equal(resolveGeminiModelName(undefined, "standard"), "gemini-2.5-flash");
});

test("client or stored model names cannot override the server routing policy", () => {
  assert.equal(resolveGeminiModelName("gemini-2.5-pro", "economy"), ECONOMY_GEMINI_MODEL);
  assert.equal(resolveGeminiModelName("unexpected-model", "standard"), STANDARD_GEMINI_MODEL);
});

test("Groq routing is pinned to the approved low-cost model", () => {
  assert.equal(resolveGroqModelName(), ECONOMY_GROQ_MODEL);
  assert.equal(resolveGroqModelName("other-model", "standard"), STANDARD_GROQ_MODEL);
});

test("Groq GPT-OSS requests reserve visible output beyond reasoning tokens", () => {
  const implementation = readFileSync(new URL("../../lib/ai/gemini.ts", import.meta.url), "utf8");
  assert.match(implementation, /max_completion_tokens: Math\.max\(config\.maxOutputTokens, 64\)/);
  assert.match(implementation, /include_reasoning: false/);
  assert.match(implementation, /Reply with exactly OK\./);
});

test("server-owned Gemini keys are confined to managed access with no starter fallback", () => {
  const source = readFileSync(new URL("../../lib/ai/gemini.ts", import.meta.url), "utf8");
  assert.match(source, /MANAGED_GEMINI_API_KEY = process\.env\.MANAGED_GEMINI_API_KEY \?\? process\.env\.GEMINI_API_KEY/);
  assert.doesNotMatch(source, /STARTER_GEMINI_API_KEY/);
  assert.match(source, /AI利用者を確認できません。ユーザーIDを指定してください。/);
});
