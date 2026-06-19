/**
 * Generates a quiet, reflective script based on recent content patterns.
 * 
 * Philosophy:
 * - Not analytical or instructional
 * - Not motivation or coaching
 * - Simply observational, breathing space
 * - Invites contemplation, not action
 * - Evening tone: gentle, paced, lingering
 * 
 * Targets: 1-2 paragraphs, 3-8 min read (for TTS)
 */

import { prisma } from "@/lib/prisma";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

interface ReflectionScriptOptions {
  userId: string;
  contentItemId?: string;
  themes?: string[];
}

export async function generateReflectionScript(
  options: ReflectionScriptOptions
): Promise<string> {
  const { userId, contentItemId, themes = [] } = options;

  // Fetch recent content to understand context
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentItems = await prisma.contentItem.findMany({
    where: {
      userId,
      createdAt: { gte: sevenDaysAgo },
    },
    select: CONTENT_ITEM_SAFE_SELECT,
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Collect all tags from recent items
  const allTags = recentItems
    .flatMap((item) => item.aiTags || [])
    .filter(Boolean);

  // Count tag frequency
  const tagFrequency = allTags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Find the most resonant tags (appeared 2+ times)
  const resonantTags = Object.entries(tagFrequency)
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag)
    .slice(0, 3);

  // User-provided themes take precedence
  const primaryThemes = themes.length > 0 ? themes : resonantTags;

  // Generate script based on patterns
  return generateScript(recentItems, primaryThemes, userId);
}

function generateScript(
  items: any[],
  themes: string[],
  userId: string
): string {
  if (items.length === 0) {
    return generateEmptyStateScript();
  }

  if (themes.length === 0) {
    // No resonant pattern—generate a simple observation
    return generateObservationalScript(items);
  }

  // Themes detected—generate reflective connection script
  return generateThematicScript(themes, items);
}

function generateObservationalScript(items: any[]): string {
  const observations = [
    `最近、いくつもの記録が積み重なってきた。
それぞれは独立しているように見えるけれど、
時間がたつと、何かが静かに繋がり始める。
その繋がりが見える瞬間ってあるんだ。

今夜、そのつながりのような…
言葉にならないもの感じながら、
明日に向けてゆっくり呼吸していよう。`,

    `過去数日のことが、頭の片隅に残っている。
完全には思い出せないけど、
なんとなく記憶に引っかかっていると言った感じ。
それが悪いわけじゃない。むしろ…

静かに積み重なった思考が、
今、ゆっくり形を作ろうとしているのかもしれない。`,

    `毎日を重ねていく中で、
ふと気づくことがある。
小さな気づきから大きな気づきまで、
すべてがどこかで繋がっているような気がする。

夜間に一人、そのつながりを感じてみること。
それが、明日への道につながるんだと思う。`,

    `この数日間、
記録を通じて自分の思考の軌跡を辿ってみた。
完結していないことも多いけど、
その道のりそのものに価値があるんだと思う。

今夜は、そうした探索の余韻のなかで、
少し立ち止まっていたい。`,
  ];

  return observations[Math.floor(Math.random() * observations.length)];
}

function generateThematicScript(themes: string[], items: any[]): string {
  const themeList = themes.slice(0, 2).join("」と「");

  const scripts = [
    `最近、「${themeList}」の記録が
静かに積み重なっていることに気づいた。
それぞれの記録は別々の出来事かもしれないけど、
同じ何かに惹かれているんだと思う。

人間の思考って面白い。
時間をかけることで、
点が線になっていく…そんな感覚。`,

    `「${themeList}」という
二つのテーマが最近よく目に入る。
一見、別の世界に見えるかもしれないけど、
実は深いところで繋がっているのかもしれない。

そうした静かな共鳴が、
思考を形づくっていくんだろう。`,

    `ここ数日、
「${themeList}」というテーマが
繰り返し浮かんでいる。
それぞれ違う形をしているけれど、
共通の問いが流れているような気がする。

その問いの方へと、
少しずつ歩を進めていくこと。
それが学びなんだと痛感している。`,

    `「${themeList}」という
二つの領域が、最近の記録のなかで
静かに交差している。
この交差点で何が起こっているのか…
それを感じることが、今は大事な気がする。`,
  ];

  return scripts[Math.floor(Math.random() * scripts.length)];
}

function generateEmptyStateScript(): string {
  return `記録が少しずつ集まり始めている。
十分な形にはなっていないかもしれないけど、
それでいい。

物事は一気に形になるんじゃなくて、
時間をかけて、静かに積層していくものなんだ。
その時間を大事にしよう。`;
}
