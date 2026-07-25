import {
  listYuiReflections,
  listYuiDecisions,
  listYuiConversations,
  listYuiEvents,
  listYuiCalendarEvents,
  listYuiGoals,
  listYuiMemories,
} from "./service";

export interface YuiThreadInsight {
  thread: string;
  frequency: number;
  lastSeenAt: string | null;
  relatedGoals: string[];
  relatedCalendarEvents: string[];
  priorityScore: number;
  suggestedNextStep: string;
}

export interface YuiThreadInsightsResult {
  threads: YuiThreadInsight[];
}

const STOP_WORDS = new Set([
  "こと", "もの", "ため", "よう", "これ", "それ", "今日", "昨日", "明日", "自分",
  "確認", "作成", "完了", "設定", "実行", "実施", "整理", "対応", "進行", "開発",
]);

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[A-Za-z0-9_]{3,}|[\u30A0-\u30FF]{2,}|[\u4E00-\u9FFF]{2,}/g);
  if (!matches) return [];
  return matches.map((w) => w.trim()).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export async function getThreadInsights(userId: string): Promise<YuiThreadInsightsResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoMs = nowMs - thirtyDaysMs;

  const [reflections, decisions, conversations, events, calendarEvents, goals, memories] =
    await Promise.all([
      listYuiReflections(userId, 30),
      listYuiDecisions(userId, 30),
      listYuiConversations(userId, 50),
      listYuiEvents(userId, 100),
      listYuiCalendarEvents(userId, { limit: 100 }),
      listYuiGoals(userId, 20),
      listYuiMemories(userId, 50),
    ]);

  // ── Collect thread stats ──
  type ThreadStat = {
    count: number;
    lastSeenMs: number;
    goalTitles: Set<string>;
    calendarTitles: Set<string>;
  };
  const threadStats: Record<string, ThreadStat> = {};

  const ensureThread = (word: string): ThreadStat => {
    if (!threadStats[word]) {
      threadStats[word] = { count: 0, lastSeenMs: 0, goalTitles: new Set(), calendarTitles: new Set() };
    }
    return threadStats[word];
  };

  const processText = (text: string, dateStr: string) => {
    const itemMs = new Date(dateStr).getTime();
    if (isNaN(itemMs) || itemMs < thirtyDaysAgoMs) return;

    for (const word of extractKeywords(text)) {
      const stat = ensureThread(word);
      stat.count += 1;
      if (itemMs > stat.lastSeenMs) stat.lastSeenMs = itemMs;
    }
  };

  // Process all data sources (past 30 days filter applied in processText)
  reflections.forEach((r) => processText(r.summary, r.created_at));
  conversations.forEach((c) => processText(c.content, c.created_at));
  events.forEach((e) => processText(e.title, e.created_at));
  memories.forEach((m) => processText(`${m.title} ${m.summary}`, m.created_at));
  decisions.forEach((d) => processText(`${d.question} ${d.decision}`, d.created_at));

  // Link calendar events to threads
  calendarEvents.forEach((ce) => {
    const ceMs = new Date(ce.start_at).getTime();
    if (isNaN(ceMs) || ceMs < thirtyDaysAgoMs) return;
    for (const word of extractKeywords(ce.title)) {
      const stat = ensureThread(word);
      stat.count += 1;
      if (ceMs > stat.lastSeenMs) stat.lastSeenMs = ceMs;
      stat.calendarTitles.add(ce.title);
    }
  });

  // Link goals to threads
  goals.forEach((g) => {
    const gMs = new Date(g.updated_at || g.created_at).getTime();
    for (const word of extractKeywords(g.title)) {
      const stat = ensureThread(word);
      if (gMs > stat.lastSeenMs) stat.lastSeenMs = gMs;
      stat.goalTitles.add(g.title);
    }
  });

  // ── Build active goal lookup for score boost ──
  const activeGoalTitles = goals
    .filter((g) => g.status === "in_progress" || g.status === "active")
    .map((g) => g.title);

  // ── Compute insights per thread ──
  const oneDayMs = 24 * 60 * 60 * 1000;

  const insights: YuiThreadInsight[] = Object.entries(threadStats)
    .filter(([, stat]) => stat.count >= 2) // require minimum frequency
    .map(([thread, stat]) => {
      // ── Priority Score (0-100) ──
      // Frequency score: 0-40
      const frequencyScore = Math.min(stat.count * 5, 40);

      // Recency score: 0-40
      const daysSinceLastSeen = Math.floor((nowMs - stat.lastSeenMs) / oneDayMs);
      let recencyScore = 0;
      if (daysSinceLastSeen <= 1) recencyScore = 40;
      else if (daysSinceLastSeen <= 3) recencyScore = 30;
      else if (daysSinceLastSeen <= 7) recencyScore = 20;
      else if (daysSinceLastSeen <= 14) recencyScore = 10;

      // Goal score: 0-20
      const hasActiveGoal = activeGoalTitles.some((gt) =>
        extractKeywords(gt).includes(thread)
      );
      const goalScore = hasActiveGoal ? 20 : (stat.goalTitles.size > 0 ? 10 : 0);

      const priorityScore = Math.min(frequencyScore + recencyScore + goalScore, 100);

      // ── Suggested Next Step (Rule Engine) ──
      const suggestedNextStep = generateNextStep(thread, stat, daysSinceLastSeen, hasActiveGoal);

      return {
        thread,
        frequency: stat.count,
        lastSeenAt: stat.lastSeenMs > 0 ? new Date(stat.lastSeenMs).toISOString() : null,
        relatedGoals: Array.from(stat.goalTitles).slice(0, 3),
        relatedCalendarEvents: Array.from(stat.calendarTitles).slice(0, 3),
        priorityScore,
        suggestedNextStep,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return { threads: insights };
}

function generateNextStep(
  thread: string,
  stat: { count: number; goalTitles: Set<string>; calendarTitles: Set<string> },
  daysSinceLastSeen: number,
  hasActiveGoal: boolean,
): string {
  // Rule 1: Active goal exists → focus on goal progress
  if (hasActiveGoal) {
    return `「${thread}」の目標進捗を確認する`;
  }

  // Rule 2: Has related calendar events → check schedule
  if (stat.calendarTitles.size > 0) {
    return `「${thread}」の予定と進行状況を確認する`;
  }

  // Rule 3: Dormant (>7 days) → re-engage
  if (daysSinceLastSeen > 7) {
    return `「${thread}」を再開し、次のアクションを決める`;
  }

  // Rule 4: High frequency recent → deepen
  if (stat.count >= 5 && daysSinceLastSeen <= 3) {
    return `「${thread}」の取り組みを深掘りする`;
  }

  // Rule 5: Default
  return `「${thread}」の関連情報を整理する`;
}
