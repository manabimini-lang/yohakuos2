import {
  listYuiReflections,
  listYuiDecisions,
  listYuiConversations,
  listYuiEvents,
  listYuiCalendarEvents,
  listYuiGoals,
  listYuiMemories,
} from "./service";

export type MemoryTimelineItem = {
  id: string;
  timeLabel: "昨日" | "3日前" | "1週間前" | "それ以前";
  title: string;
  description: string;
  dateStr: string;
};

export type YuiMemoryLayer = {
  activeThreads: string[];
  dormantThreads: string[];
  timeline: MemoryTimelineItem[];
};

export async function computeYuiMemoryLayer(userId: string): Promise<YuiMemoryLayer> {
  const now = new Date();
  const nowMs = now.getTime();

  const [reflections, decisions, conversations, events, calendarEvents, goals, memories] =
    await Promise.all([
      listYuiReflections(userId, 20),
      listYuiDecisions(userId, 20),
      listYuiConversations(userId, 30),
      listYuiEvents(userId, 50),
      listYuiCalendarEvents(userId, { limit: 50 }),
      listYuiGoals(userId, 20),
      listYuiMemories(userId, 50),
    ]);

  // Track keywords with last seen timestamp and frequency count
  const threadStats: Record<string, { count: number; lastSeenMs: number }> = {};
  const stopWords = new Set([
    "こと", "もの", "ため", "よう", "これ", "それ", "今日", "昨日", "明日", "自分",
    "確認", "作成", "完了", "設定", "実行", "実施", "整理", "対応", "進行", "開発"
  ]);

  const processText = (text: string, dateStr: string) => {
    if (!text) return;
    const itemMs = new Date(dateStr).getTime();
    if (isNaN(itemMs)) return;

    const matches = text.match(/[A-Za-z0-9_]{3,}|[\u30A0-\u30FF]{2,}|[\u4E00-\u9FFF]{2,}/g);
    if (!matches) return;

    for (const rawWord of matches) {
      const word = rawWord.trim();
      if (word.length >= 2 && !stopWords.has(word)) {
        if (!threadStats[word]) {
          threadStats[word] = { count: 0, lastSeenMs: itemMs };
        }
        threadStats[word].count += 1;
        if (itemMs > threadStats[word].lastSeenMs) {
          threadStats[word].lastSeenMs = itemMs;
        }
      }
    }
  };

  // Collect text & timestamps across all resources
  reflections.forEach((r) => processText(r.summary, r.created_at));
  conversations.forEach((c) => processText(c.content, c.created_at));
  events.forEach((e) => processText(e.title, e.created_at));
  memories.forEach((m) => processText(`${m.title} ${m.summary}`, m.created_at));
  calendarEvents.forEach((ce) => processText(ce.title, ce.start_at));
  goals.forEach((g) => processText(g.title, g.updated_at || g.created_at));

  // 14 days threshold for dormant threads
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const activeThreads: string[] = [];
  const dormantThreads: string[] = [];

  Object.entries(threadStats).forEach(([word, stat]) => {
    const ageMs = nowMs - stat.lastSeenMs;

    if (ageMs >= fourteenDaysMs) {
      dormantThreads.push(word);
    } else if (ageMs <= sevenDaysMs && stat.count >= 1) {
      activeThreads.push(word);
    }
  });

  // Fallback defaults if no items found
  const defaultActive = ["YOHAKU", "YUI", "通知改善"];
  const defaultDormant = ["Google Calendar連携", "OAuth設定"];

  const finalActiveThreads = activeThreads.slice(0, 5);
  const finalDormantThreads = dormantThreads.slice(0, 5);

  // ----------------------------------------------------
  // Build Memory Timeline ("昨日", "3日前", "1週間前", "それ以前")
  // ----------------------------------------------------
  const rawTimelineItems: Array<{ id: string; title: string; description: string; dateMs: number; dateStr: string }> = [];

  goals.forEach((g) => {
    rawTimelineItems.push({
      id: `goal-${g.id}`,
      title: `目標: ${g.title}`,
      description: g.description || "進行中のプロジェクト",
      dateMs: new Date(g.created_at).getTime(),
      dateStr: g.created_at,
    });
  });

  reflections.forEach((r) => {
    rawTimelineItems.push({
      id: `ref-${r.id}`,
      title: "振り返り実施",
      description: r.insights?.[0] || r.summary,
      dateMs: new Date(r.created_at).getTime(),
      dateStr: r.created_at,
    });
  });

  decisions.forEach((d) => {
    rawTimelineItems.push({
      id: `dec-${d.id}`,
      title: `意思決定: ${d.question}`,
      description: d.decision || d.rationale || "方針の決定",
      dateMs: new Date(d.created_at).getTime(),
      dateStr: d.created_at,
    });
  });

  memories.forEach((m) => {
    rawTimelineItems.push({
      id: `mem-${m.id}`,
      title: `記憶: ${m.title}`,
      description: m.summary,
      dateMs: new Date(m.created_at).getTime(),
      dateStr: m.created_at,
    });
  });

  // Sort descending by date
  rawTimelineItems.sort((a, b) => b.dateMs - a.dateMs);

  const oneDayMs = 24 * 60 * 60 * 1000;
  const timeline: MemoryTimelineItem[] = rawTimelineItems.slice(0, 6).map((item) => {
    const diffDays = Math.floor((nowMs - item.dateMs) / oneDayMs);
    let timeLabel: "昨日" | "3日前" | "1週間前" | "それ以前" = "それ以前";

    if (diffDays <= 1) {
      timeLabel = "昨日";
    } else if (diffDays <= 4) {
      timeLabel = "3日前";
    } else if (diffDays <= 7) {
      timeLabel = "1週間前";
    }

    return {
      id: item.id,
      timeLabel,
      title: item.title,
      description: item.description,
      dateStr: new Date(item.dateMs).toLocaleDateString("ja-JP"),
    };
  });

  return {
    activeThreads: finalActiveThreads.length > 0 ? finalActiveThreads : defaultActive,
    dormantThreads: finalDormantThreads.length > 0 ? finalDormantThreads : defaultDormant,
    timeline,
  };
}
