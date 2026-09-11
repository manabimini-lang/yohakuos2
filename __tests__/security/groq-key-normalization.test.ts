import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGroqApiKey } from "../../lib/ai/groq-key.ts";

test("normalizes surrounding whitespace on a Groq key", () => {
  const key = `gsk_${"A".repeat(40)}`;
  assert.equal(normalizeGroqApiKey(`  ${key}\n`), key);
});

test("rejects placeholders, embedded whitespace, and arbitrary text", () => {
  for (const value of ["gsk_short", `gsk_${"A".repeat(20)} key`, "••••••••", "not-a-groq-key"]) {
    assert.throws(() => normalizeGroqApiKey(value), /Groq APIキーの形式が無効/);
  }
});
