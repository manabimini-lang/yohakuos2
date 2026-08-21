import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGeminiApiKey } from "../../lib/ai/gemini-key.ts";

test("normalizes surrounding whitespace on supported Gemini key formats", () => {
  const key = `AIza${"A".repeat(32)}`;
  assert.equal(normalizeGeminiApiKey(`  ${key}\n`), key);
});

test("rejects non-ASCII, embedded whitespace, placeholders, and arbitrary long text", () => {
  const invalidValues = [
    `AIza${"A".repeat(10)}秘密${"B".repeat(20)}`,
    `AIza${"A".repeat(20)} ${"B".repeat(20)}`,
    "••••••••",
    "これはGemini APIキーではありません".repeat(40),
  ];

  for (const value of invalidValues) {
    assert.throws(() => normalizeGeminiApiKey(value), /Gemini APIキーの形式が無効/);
  }
});
