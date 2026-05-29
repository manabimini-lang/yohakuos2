import { prisma } from "@/lib/prisma";
import { detectReturningThemes, detectLifeDirection } from "@/lib/life/life-themes-engine";
import { getLatestPhilosophyFragments } from "@/lib/memory/philosophy";

interface DailyRitualPastMemory {
  source: string;
  title: string;
  snippet: string;
  date: string;
  tags: string[];
}

interface DailyRitualData {
  id: string;
  userId: string;
  date: Date;
  quietQuestion: string;
  ambientReflection: string;
  returningThemes: Array<{
    name: string;
    cycleCount: number;
    gapDays: number;
    firstAppeared: Date;
    lastAppeared: Date;
    philosophy?: string;
  }>;
  philosophyFragments: Array<{
    fragment: string;
    sourceTheme: string;
  }>;
  pastMemories: DailyRitualPastMemory[];
  audioReflectionId?: string | null;
  audioUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SEASON_LABELS = [
  "冬",
  "冬",
  "春",
  "春",
  "初夏",
  "初夏",
  "夏",
  "夏",
  "秋",
  "秋",
  "冬",
  "冬",
];

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildQuietQuestion(
  returningThemes: DailyRitualData["returningThemes"],
  pastMemories: DailyRitualPastMemory[]
) {
  if (returningThemes.length > 0) {
    return "最近、何度も戻ってきているテーマはありますか？その感覚は、以前とどう違っていますか。";
  }

  if (pastMemories.length > 0) {
    return "過去の記録と向き合うと、今の関心にはどんな違いが見えますか。";
  }

  return "今日は、記録の重なりを静かに眺めてみませんか。";
}

function buildPastMemorySnippet(item: any) {
  const text = item.reflection || item.summary || item.title || "小さな記録";
  return text.trim().slice(0, 120);
}

function buildPastMemorySource(item: any, currentMonth: number, weekAgo: Date) {
  const monthMatches = item.createdAt.getMonth() === currentMonth;
  const recent = item.createdAt >= weekAgo;
  if (monthMatches && item.createdAt.getFullYear() < new Date().getFullYear()) {
    return "同じ月の記録";
  }
  if (recent) {
    return "先週の記録";
  }
  return "関係のある記録";
}

function buildTimeline(returningThemes: DailyRitualData["returningThemes"]): Array<{ label: string; title: string }> {
  return returningThemes.slice(0, 3).map((theme) => {
    const label = theme.firstAppeared
      ? SEASON_LABELS[new Date(theme.firstAppeared).getMonth()] || "季節"
      : "季節";

    return {
      label,
      title: theme.name,
    };
  });
}

export async function getTodayDailyRitual(userId: string) {
  const today = toDateOnly(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const ritual = await prisma.dailyRitual.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return ritual as DailyRitualData | null;
}

export async function generateDailyRitual(userId: string) {
  const itemCount = await prisma.contentItem.count({
    where: {
      userId,
      memoryState: "active",
    },
  });

  if (itemCount < 10) {
    return null;
  }

  const today = toDateOnly(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [returningThemes, philosophyFragments, ambientReflection, audioReflection, contentItems] = await Promise.all([
    detectReturningThemes(userId),
    getLatestPhilosophyFragments(userId, 4),
    detectLifeDirection(userId),
    prisma.audioReflection.findFirst({
      where: {
        userId,
        status: "completed",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        audioUrl: { not: null },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contentItem.findMany({
      where: {
        userId,
        memoryState: "active",
      },
      select: {
        id: true,
        title: true,
        summary: true,
        reflection: true,
        aiTags: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const currentMonth = today.getMonth();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const topThemeNames = returningThemes.slice(0, 3).map((theme) => theme.name);
  const sameMonthItems = contentItems.filter(
    (item) => item.createdAt.getMonth() === currentMonth && item.createdAt.getFullYear() < today.getFullYear()
  );
  const recentWeekItems = contentItems.filter(
    (item) => item.createdAt < today && item.createdAt >= weekAgo
  );
  const themeItems = contentItems.filter(
    (item) =>
      item.aiTags && item.aiTags.some((tag) => topThemeNames.includes(tag))
  );

  const candidateItems = [
    ...sameMonthItems,
    ...recentWeekItems,
    ...themeItems,
  ]
    .filter((item, index, all) =>
      all.findIndex((other) => other.id === item.id) === index
    )
    .slice(0, 3);

  const pastMemories = candidateItems.map((item) => ({
    source: buildPastMemorySource(item, currentMonth, weekAgo),
    title: item.title || item.aiTags?.[0] || "記録",
    snippet: buildPastMemorySnippet(item),
    date: item.createdAt.toISOString(),
    tags: item.aiTags ?? [],
  }));

  const quietQuestion = buildQuietQuestion(returningThemes, pastMemories);
  const ritual = await prisma.dailyRitual.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      quietQuestion,
      ambientReflection,
      returningThemes: returningThemes as any,
      philosophyFragments: philosophyFragments as any,
      pastMemories,
      audioReflectionId: audioReflection?.id || null,
      audioUrl: audioReflection?.audioUrl || null,
    },
    create: {
      userId,
      date: today,
      quietQuestion,
      ambientReflection,
      returningThemes: returningThemes as any,
      philosophyFragments: philosophyFragments as any,
      pastMemories,
      audioReflectionId: audioReflection?.id || null,
      audioUrl: audioReflection?.audioUrl || null,
    },
  });

  return ritual as any;
}

export function buildRitualTimelineItems(
  returningThemes: DailyRitualData["returningThemes"]
) {
  return returningThemes.slice(0, 3).map((theme) => ({
    label: SEASON_LABELS[new Date(theme.firstAppeared).getMonth()] || "季節",
    title: theme.name,
  }));
}
