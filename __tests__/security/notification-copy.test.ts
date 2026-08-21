import assert from "node:assert/strict";
import test from "node:test";
import { getYuiGreeting, normalizeNotificationCopy } from "../../app/ui/backend/yui/notification_copy.ts";

test("morning notifications always use a morning greeting", () => {
  const normalized = normalizeNotificationCopy("こんばんは。\n\n今日の予定です。", "morning");
  assert.equal(normalized, "おはようございます。\n\n今日の予定です。");
});

test("notification copy collapses duplicate Japanese punctuation", () => {
  assert.equal(
    normalizeNotificationCopy("おはようございます。\n\n今日も進めましょう。。", "morning"),
    "おはようございます。\n\n今日も進めましょう。",
  );
});

test("morning notification removes a nested evening greeting from the brief", () => {
  assert.equal(
    normalizeNotificationCopy("おはようございます。\n\n今日は「こんばんは。今日は予定があります。」を優先しましょう。", "morning"),
    "おはようございます。\n\n今日は「今日は予定があります。」を優先しましょう。",
  );
});

test("brief greeting uses Japan time instead of the server timezone", () => {
  assert.equal(getYuiGreeting(new Date("2026-08-21T01:00:00.000Z")), "おはようございます");
});
