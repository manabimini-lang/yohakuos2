import {
  listYuiReflections,
  listYuiDecisions,
  listYuiConversations,
  listYuiEvents,
  listYuiCalendarEvents,
  listYuiGoals,
  listYuiMemories,
} from "./service";
import { computeYuiContext } from "./context_service";

export interface YuiDailyContext {
  title: string;
  summary: string;
  sourceType: "priority" | "reflection" | "goal" | "calendar";
  memorySignals: string[];
}

export async function getDailyContext(userId: string): Promise<YuiDailyContext> {
  const now = new Date();

  // Define 7 days window
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(now);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  const yesterdayStartMs = startOfYesterday.getTime();
  const yesterdayEndMs = endOfYesterday.getTime();

  const [reflections, decisions, conversations, events, calendarEvents, goals, memories, context] =
    await Promise.all([
      listYuiReflections(userId, 10),
      listYuiDecisions(userId, 10),
      listYuiConversations(userId, 20),
      listYuiEvents(userId, 50),
      listYuiCalendarEvents(userId, { limit: 50 }),
      listYuiGoals(userId, 10),
      listYuiMemories(userId, 30),
      computeYuiContext(userId),
    ]);

  // Extract yesterday items based on priority rules:
  // 1. Yesterday Priority / Context
  // 2. Uncompleted Tasks / Goals
  // 3. Yesterday / Recent Reflection
  // 4. Calendar / Continuity

  let title = "昨日からの継続";
  let summary = "昨日の流れを維持して、今日も自分のペースで進めていきましょう。";
  let sourceType: "priority" | "reflection" | "goal" | "calendar" = "priority";

  // Check 1: Yesterday Reflection
  const yesterdayReflections = reflections.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  // Check 2: Uncompleted Goals / Priority
  const activeGoals = goals.filter((g) => g.status === "in_progress");

  // Check 3: Yesterday Calendar
  const yesterdayCalendar = calendarEvents.filter((ce) => {
    const t = new Date(ce.start_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  if (context.priority && context.priority !== "本日のテーマを設定") {
    sourceType = "priority";
    title = `注力テーマ: ${context.priority}`;
    summary = `昨日は「${context.priority}」に取り組んでいました。今日も継続すると流れを維持しやすそうです。`;
  } else if (yesterdayReflections.length > 0) {
    const ref = yesterdayReflections[0];
    const insight = ref.insights?.[0] || ref.summary;
    sourceType = "reflection";
    title = "昨日の振り返りより";
    summary = `昨日は「${insight}」に意識が向けられていました。今日もその気付きを活かしていきましょう。`;
  } else if (activeGoals.length > 0) {
    const goal = activeGoals[0];
    sourceType = "goal";
    title = `進行中の目標: ${goal.title}`;
    summary = `目標「${goal.title}」に向けた取り組みが続いています。一歩ずつ前進しましょう。`;
  } else if (yesterdayCalendar.length > 0) {
    const event = yesterdayCalendar[0];
    sourceType = "calendar";
    title = `昨日の予定: ${event.title}`;
    summary = `昨日は「${event.title}」などの予定に対応しました。今日の予定もスムーズに進めましょう。`;
  } else if (reflections.length > 0) {
    const ref = reflections[0];
    const insight = ref.insights?.[0] || ref.summary;
    sourceType = "reflection";
    title = "直近の振り返りより";
    summary = `直近では「${insight}」について整理していました。本日のテーマにも繋げていきましょう。`;
  }

  // ----------------------------------------------------
  // Extract Memory Signals (Frequently occurring themes past 7 days)
  // ----------------------------------------------------
  const wordCounts: Record<string, number> = {};
  const stopWords = new Set([
    "こと", "もの", "ため", "よう", "これ", "それ", "今日", "昨日", "明日", "自分",
    "確認", "作成", "完了", "設定", "実行", "実施", "整理", "対応", "進行", "開発"
  ]);

  const collectText = (text: string) => {
    if (!text) return;
    // Extract katakana words, english terms, and kanji words (2+ chars)
    const matches = text.match(/[A-Za-z0-9_]{3,}|[\u30A0-\u30FF]{2,}|[\u4E00-\u9FFF]{2,}/g);
    if (!matches) return;
    for (const rawWord of matches) {
      const word = rawWord.trim();
      if (word.length >= 2 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
  };

  const isRecent = (dateStr: string) => {
    return new Date(dateStr).getTime() >= sevenDaysAgo.getTime();
  };

  // Collect text from past 7 days resources
  reflections.filter((r) => isRecent(r.created_at)).forEach((r) => collectText(r.summary));
  conversations.filter((c) => isRecent(c.created_at)).forEach((c) => collectText(c.content));
  events.filter((e) => isRecent(e.created_at)).forEach((e) => collectText(e.title));
  memories.filter((m) => isRecent(m.created_at)).forEach((m) => collectText(`${m.title} ${m.summary}`));
  calendarEvents.filter((ce) => isRecent(ce.start_at)).forEach((ce) => collectText(ce.title));

  // Sort and select top memory signals
  const sortedSignals = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 5);

  // Fallback defaults if no signals found
  const memorySignals = sortedSignals.length > 0 ? sortedSignals : ["YUI", "通知", "Google Calendar"];

  return {
    title,
    summary,
    sourceType,
    memorySignals,
  };
}
