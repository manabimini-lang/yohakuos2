import {
  listYuiReflections,
  listYuiDecisions,
  listYuiConversations,
  listYuiEvents,
  listYuiCalendarEvents,
  listYuiGoals,
  listYuiMemories,
} from "./service";

export interface YuiThreadProgress {
  thread: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  activeDays: number;
  progressStatus: "new" | "active" | "stalled" | "completed";
  momentumScore: number;
}

export interface YuiProgressResult {
  threads: YuiThreadProgress[];
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getThreadProgress(userId: string): Promise<YuiProgressResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const ninetyDaysMs = 90 * ONE_DAY_MS;
  const ninetyDaysAgoMs = nowMs - ninetyDaysMs;

  const [reflections, decisions, conversations, events, calendarEvents, goals, memories] =
    await Promise.all([
      listYuiReflections(userId, 50),
      listYuiDecisions(userId, 50),
      listYuiConversations(userId, 100),
      listYuiEvents(userId, 200),
      listYuiCalendarEvents(userId, { limit: 200 }),
      listYuiGoals(userId, 30),
      listYuiMemories(userId, 100),
    ]);

  // ── Collect per-thread stats ──
  type ThreadStat = {
    firstSeenMs: number;
    lastSeenMs: number;
    activeDateSet: Set<string>; // YYYY-MM-DD strings for unique day counting
    goalStatuses: Set<string>;
  };
  const threadStats: Record<string, ThreadStat> = {};

  const ensureThread = (word: string): ThreadStat => {
    if (!threadStats[word]) {
      threadStats[word] = {
        firstSeenMs: Infinity,
        lastSeenMs: 0,
        activeDateSet: new Set(),
        goalStatuses: new Set(),
      };
    }
    return threadStats[word];
  };

  const processText = (text: string, dateStr: string) => {
    const itemMs = new Date(dateStr).getTime();
    if (isNaN(itemMs) || itemMs < ninetyDaysAgoMs) return;

    const dayKey = new Date(dateStr).toISOString().slice(0, 10);
    for (const word of extractKeywords(text)) {
      const stat = ensureThread(word);
      if (itemMs < stat.firstSeenMs) stat.firstSeenMs = itemMs;
      if (itemMs > stat.lastSeenMs) stat.lastSeenMs = itemMs;
      stat.activeDateSet.add(dayKey);
    }
  };

  // Process all data sources
  reflections.forEach((r) => processText(r.summary, r.created_at));
  conversations.forEach((c) => processText(c.content, c.created_at));
  events.forEach((e) => processText(e.title, e.created_at));
  memories.forEach((m) => processText(`${m.title} ${m.summary}`, m.created_at));
  decisions.forEach((d) => processText(`${d.question} ${d.decision}`, d.created_at));

  calendarEvents.forEach((ce) => {
    const ceMs = new Date(ce.start_at).getTime();
    if (isNaN(ceMs) || ceMs < ninetyDaysAgoMs) return;
    const dayKey = new Date(ce.start_at).toISOString().slice(0, 10);
    for (const word of extractKeywords(ce.title)) {
      const stat = ensureThread(word);
      if (ceMs < stat.firstSeenMs) stat.firstSeenMs = ceMs;
      if (ceMs > stat.lastSeenMs) stat.lastSeenMs = ceMs;
      stat.activeDateSet.add(dayKey);
    }
  });

  // Link goal statuses to threads
  goals.forEach((g) => {
    const gMs = new Date(g.updated_at || g.created_at).getTime();
    for (const word of extractKeywords(g.title)) {
      const stat = ensureThread(word);
      if (gMs < stat.firstSeenMs) stat.firstSeenMs = gMs;
      if (gMs > stat.lastSeenMs) stat.lastSeenMs = gMs;
      stat.goalStatuses.add(g.status);
    }
  });

  // ── Compute progress for each thread ──
  const sevenDaysMs = 7 * ONE_DAY_MS;
  const fourteenDaysMs = 14 * ONE_DAY_MS;

  const threads: YuiThreadProgress[] = Object.entries(threadStats)
    .filter(([, stat]) => stat.activeDateSet.size >= 2) // require at least 2 active days
    .map(([thread, stat]) => {
      const firstSeenMs = stat.firstSeenMs === Infinity ? null : stat.firstSeenMs;
      const lastSeenMs = stat.lastSeenMs === 0 ? null : stat.lastSeenMs;
      const activeDays = stat.activeDateSet.size;
      const daysSinceFirstSeen = firstSeenMs != null ? Math.floor((nowMs - firstSeenMs) / ONE_DAY_MS) : 0;
      const daysSinceLastSeen = lastSeenMs != null ? Math.floor((nowMs - lastSeenMs) / ONE_DAY_MS) : Infinity;

      // ── Progress Status ──
      let progressStatus: YuiThreadProgress["progressStatus"];
      if (stat.goalStatuses.has("completed") && !stat.goalStatuses.has("active") && !stat.goalStatuses.has("in_progress")) {
        progressStatus = "completed";
      } else if (daysSinceFirstSeen <= 7 && daysSinceLastSeen <= 7) {
        progressStatus = "new";
      } else if (daysSinceLastSeen > 14) {
        progressStatus = "stalled";
      } else {
        progressStatus = "active";
      }

      // ── Momentum Score (0-100) ──
      // Active days score: 0-40
      const activeDaysScore = Math.min(activeDays * 4, 40);

      // Recency score: 0-40
      let recencyScore = 0;
      if (daysSinceLastSeen <= 1) recencyScore = 40;
      else if (daysSinceLastSeen <= 3) recencyScore = 30;
      else if (daysSinceLastSeen <= 7) recencyScore = 20;
      else if (daysSinceLastSeen <= 14) recencyScore = 10;

      // Goal score: 0-20
      let goalScore = 0;
      if (stat.goalStatuses.has("active") || stat.goalStatuses.has("in_progress")) goalScore = 20;
      else if (stat.goalStatuses.has("completed")) goalScore = 5;
      else if (stat.goalStatuses.size > 0) goalScore = 10;

      const momentumScore = progressStatus === "completed"
        ? 0
        : Math.min(activeDaysScore + recencyScore + goalScore, 100);

      return {
        thread,
        firstSeenAt: firstSeenMs != null ? new Date(firstSeenMs).toISOString() : null,
        lastSeenAt: lastSeenMs != null ? new Date(lastSeenMs).toISOString() : null,
        activeDays,
        progressStatus,
        momentumScore,
      };
    })
    .sort((a, b) => b.momentumScore - a.momentumScore)
    .slice(0, 5);

  return { threads };
}
