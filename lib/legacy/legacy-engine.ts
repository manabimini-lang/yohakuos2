import { prisma } from "@/lib/prisma";
import { extractLifeThemes, detectReturningThemes, type LifeTheme, type ReturningTheme, type PhilosophyFragment, } from "@/lib/life/life-themes-engine";
import { getLatestPhilosophyFragments } from "@/lib/memory/philosophy";

export const SEASON_LABELS: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

export function getSeasonLabel(season: string) {
  return SEASON_LABELS[season] ?? season;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSeasonLabel(season: string) {
  return SEASON_LABELS[season] ?? season;
}

function buildPhilosophyDrift(
  summaries: Array<{ period: string; themes: string[] }> | null,
  fragments: PhilosophyFragment[]
) {
  if (!summaries || summaries.length < 2) {
    if (fragments.length >= 2) {
      return {
        earlier: fragments[0].sourceTheme,
        later: fragments[1].sourceTheme,
        text: `以前の記録には「${fragments[0].sourceTheme}」が静かに現れていました。最近は「${fragments[1].sourceTheme}」への関心が少し強まっているようです。`,
      };
    }
    return null;
  }

  const first = summaries[0];
  const last = summaries[summaries.length - 1];
  const earlier = first.themes?.[0] || getSeasonLabel(first.period);
  const later = last.themes?.[0] || getSeasonLabel(last.period);

  if (earlier === later) {
    return {
      earlier,
      later,
      text: `以前も今も、「${later}」が静かに繰り返されています。人生の風景が少しずつ重なっていくようです。`,
    };
  }

  return {
    earlier,
    later,
    text: `以前は、「${earlier}」が中心でしたが、最近は「${later}」への関心が強まっています。`,
  };
}

function buildLifeChapters(
  summaries: Array<{ period: string; season: string; year: number; summary: string; themes: string[] }> | null,
  themes: LifeTheme[]
) {
  if (summaries && summaries.length > 0) {
    return summaries.slice(-4).reverse().map((summary) => ({
      title: `${getSeasonLabel(summary.season)} ${summary.year} の時期`,
      periodLabel: summary.period,
      description: summary.summary,
      themes: summary.themes || [],
    }));
  }

  if (themes.length > 0) {
    return themes.slice(0, 4).map((theme) => ({
      title: `「${theme.name}」の時期`,
      periodLabel: `${formatDateLabel(theme.firstAppeared)} 〜 ${formatDateLabel(theme.lastAppeared)}`,
      description: theme.description,
      themes: theme.tags,
    }));
  }

  return [];
}

function buildResonancePath(returningThemes: ReturningTheme[]) {
  return returningThemes.slice(0, 5).map((theme) => theme.name);
}

function buildTimelineEntries(
  summaries: Array<{ period: string; season: string; year: number; summary: string; themes: string[]; startDate: Date }> = []
) {
  return summaries.map((summary) => ({
    label: `${getSeasonLabel(summary.season)} ${summary.year}`,
    title: summary.themes?.[0] || getSeasonLabel(summary.season),
    description: summary.summary,
    date: summary.startDate,
  }));
}

function buildLegacyExportText(data: LegacyPageData) {
  const lines: string[] = [];
  lines.push("YOHAKU Legacy Snapshot");
  lines.push("");
  lines.push("このテキストは、長い時間の中で静かに重なってきた記録をまとめたものです。");
  lines.push("");

  if (data.seasonalSummaries.length > 0) {
    lines.push("■ 季節の空気感");
    data.seasonalSummaries.forEach((summary) => {
      lines.push(`- ${getSeasonLabel(summary.season)} ${summary.year}: ${summary.summary}`);
      if (summary.themes?.length > 0) {
        lines.push(`  テーマ: ${summary.themes.join("、")}`);
      }
    });
    lines.push("");
  }

  if (data.returningThemes.length > 0) {
    lines.push("■ 何度も戻ってくること");
    data.returningThemes.forEach((theme) => {
      lines.push(`- ${theme.name} (${theme.cycleCount}度)`);
    });
    lines.push("");
  }

  if (data.philosophyDrift) {
    lines.push("■ 思想の変化");
    lines.push(data.philosophyDrift.text);
    lines.push("");
  }

  if (data.pastLetters.length > 0) {
    lines.push("■ 以前の余白");
    data.pastLetters.forEach((letter) => {
      lines.push(`- ${letter.date}: ${letter.excerpt}`);
    });
    lines.push("");
  }

  if (data.lifeChapters.length > 0) {
    lines.push("■ 人生の章");
    data.lifeChapters.forEach((chapter) => {
      lines.push(`- ${chapter.title}`);
      if (chapter.description) {
        lines.push(`  ${chapter.description}`);
      }
    });
    lines.push("");
  }

  if (data.resonancePath.length > 0) {
    lines.push("■ 長期的な響き");
    lines.push(data.resonancePath.join(" ↕ "));
    lines.push("");
  }

  if (data.seasonalNarrative) {
    lines.push("■ その空気感");
    lines.push(data.seasonalNarrative);
    lines.push("");
  }

  return lines.join("\n");
}

export interface LegacyChapter {
  title: string;
  periodLabel: string;
  description: string;
  themes: string[];
}

export interface PastLetter {
  id: string;
  excerpt: string;
  date: string;
  createdAt: Date;
}

export interface LegacyPageData {
  seasonalSummaries: Array<{ period: string; season: string; year: number; summary: string; themes: string[]; startDate: Date; endDate: Date }>;
  returningThemes: ReturningTheme[];
  philosophyFragments: PhilosophyFragment[];
  pastLetters: PastLetter[];
  lifeChapters: LegacyChapter[];
  philosophyDrift: { earlier: string; later: string; text: string } | null;
  resonancePath: string[];
  timelineEntries: Array<{ label: string; title: string; description: string; date: Date }>;
  seasonalNarrative: string;
  exportText: string;
}

export async function getLegacyPageData(userId: string): Promise<LegacyPageData> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

  const [seasonalSummaries, returningThemes, philosophyFragments, pastLettersRaw] = await Promise.all([
    prisma.seasonalSummary.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
      take: 16,
    }),
    detectReturningThemes(userId),
    getLatestPhilosophyFragments(userId, 4),
    prisma.reflection.findMany({
      where: {
        userId,
        createdAt: {
          gte: fourMonthsAgo,
          lte: threeMonthsAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const lifeThemes = await extractLifeThemes(userId, 12);

  const letters = pastLettersRaw.map((letter) => ({
    id: letter.id,
    excerpt: letter.reflectionText.slice(0, 140),
    date: formatDateLabel(letter.createdAt),
    createdAt: letter.createdAt,
  }));

  const chapters = buildLifeChapters(seasonalSummaries, lifeThemes);
  const philosophyDrift = buildPhilosophyDrift(
    seasonalSummaries.length > 1
      ? seasonalSummaries.map((summary) => ({
          period: summary.period,
          themes: Array.isArray(summary.themes) ? summary.themes : [],
        }))
      : null,
    philosophyFragments
  );
  const resonancePath = buildResonancePath(returningThemes);
  const timelineEntries = buildTimelineEntries(seasonalSummaries);

  const seasonalNarrative = seasonalSummaries.length === 0
    ? "時間とともに、季節ごとの空気感が少しずつ形作られていきます。"
    : seasonalSummaries.slice(-3).map((summary) => {
        return `${getSeasonLabel(summary.season)} ${summary.year} は、${summary.themes?.slice(0, 3).join("、")} の余白が漂っていました。`;
      }).join(" ");

  const exportText = buildLegacyExportText({
    seasonalSummaries,
    returningThemes,
    philosophyFragments,
    pastLetters: letters,
    lifeChapters: chapters,
    philosophyDrift,
    resonancePath,
    timelineEntries,
    seasonalNarrative,
    exportText: "",
  });

  return {
    seasonalSummaries,
    returningThemes,
    philosophyFragments,
    pastLetters: letters,
    lifeChapters: chapters,
    philosophyDrift,
    resonancePath,
    timelineEntries,
    seasonalNarrative,
    exportText,
  };
}

export async function getLatestLegacySnapshot(userId: string) {
  return prisma.legacySnapshot.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function generateLegacySnapshot(userId: string) {
  const data = await getLegacyPageData(userId);

  if (data.seasonalSummaries.length === 0 && data.returningThemes.length === 0) {
    return null;
  }

  const period = data.seasonalSummaries.length > 0
    ? data.seasonalSummaries[data.seasonalSummaries.length - 1].period
    : `legacy_${new Date().toISOString().slice(0, 7)}`;

  const title = `人生の軌跡スナップショット ${period}`;
  const content = data.exportText;

  const record = await prisma.legacySnapshot.upsert({
    where: { userId_period: { userId, period } },
    update: {
      title,
      content,
      themes: data.seasonalSummaries.flatMap((summary) => summary.themes ?? []),
      chapters: data.lifeChapters,
    },
    create: {
      userId,
      period,
      type: "legacy",
      title,
      content,
      themes: data.seasonalSummaries.flatMap((summary) => summary.themes ?? []),
      chapters: data.lifeChapters,
    },
  });

  return record;
}

export function buildLegacyTextExport(data: LegacyPageData) {
  return buildLegacyExportText(data);
}
