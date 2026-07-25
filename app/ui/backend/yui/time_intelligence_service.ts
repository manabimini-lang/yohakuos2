import { listYuiCalendarEvents } from "./service";

export interface YuiTimeInsight {
  category: string;
  totalHours: number;
  percentage: number;
}

export interface YuiTimeIntelligence {
  topCategories: YuiTimeInsight[];
  peakFocusHour: number | null;
  totalScheduledHours: number;
}

// ── Category classification by title keywords ──
const CATEGORY_RULES: { category: string; patterns: RegExp }[] = [
  {
    category: "meeting",
    patterns: /meeting|ミーティング|MTG|mtg|打ち合わせ|打合せ|会議|定例|朝会|1on1|面談|sync|standup|huddle|check-in/i,
  },
  {
    category: "focus",
    patterns: /作業|集中|開発|コーディング|coding|development|実装|レビュー|review|design|設計|デザイン|sprint|タスク/i,
  },
  {
    category: "learning",
    patterns: /勉強|学習|study|lecture|セミナー|研修|reading|読書|tutorial|workshop|conference|カンファレンス|勉強会|輪読/i,
  },
  {
    category: "family",
    patterns: /家族|family|送迎|送り|迎え|子供|こども|育児|保育|習い事|お迎え|参観|運動会|帰省/i,
  },
  {
    category: "health",
    patterns: /運動|exercise|ジム|gym|yoga|ヨガ|散歩|walk|run|ランニング|通院|病院|歯科|健康|筋トレ|ストレッチ/i,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  meeting: "ミーティング",
  focus: "集中作業",
  learning: "学習",
  family: "家族",
  health: "健康",
  other: "その他",
};

function classifyCategory(title: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.test(title)) {
      return rule.category;
    }
  }
  return "other";
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export async function getTimeIntelligence(userId: string): Promise<YuiTimeIntelligence> {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const calendarEvents = await listYuiCalendarEvents(userId, {
    start: fourteenDaysAgo,
    end: now,
    limit: 500,
  });

  // No events → return empty but valid result
  if (calendarEvents.length === 0) {
    return {
      topCategories: [],
      peakFocusHour: null,
      totalScheduledHours: 0,
    };
  }

  // ── Aggregate hours per category ──
  const categoryHours: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  let totalHours = 0;

  for (const event of calendarEvents) {
    const startMs = new Date(event.start_at).getTime();
    const endMs = new Date(event.end_at).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) continue;

    const durationHours = (endMs - startMs) / (1000 * 60 * 60);
    // Cap individual event at 12 hours to avoid all-day event skew
    const cappedHours = Math.min(durationHours, 12);

    const category = classifyCategory(event.title);
    categoryHours[category] = (categoryHours[category] ?? 0) + cappedHours;
    totalHours += cappedHours;

    // Track start hour for peak focus detection
    const startHour = new Date(event.start_at).getHours();
    hourCounts[startHour] = (hourCounts[startHour] ?? 0) + 1;
  }

  // ── Build topCategories sorted by hours desc ──
  const topCategories: YuiTimeInsight[] = Object.entries(categoryHours)
    .map(([category, hours]) => ({
      category,
      totalHours: Math.round(hours * 10) / 10, // 1 decimal
      percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 6);

  // ── Peak focus hour ──
  let peakFocusHour: number | null = null;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakFocusHour = Number(hour);
    }
  }

  return {
    topCategories,
    peakFocusHour,
    totalScheduledHours: Math.round(totalHours * 10) / 10,
  };
}
