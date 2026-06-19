import { prisma } from "@/lib/prisma";
import { generateText } from "./gemini";
import { ThemeType, ContextType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

export interface YohakuResult {
  dominantThemes: ThemeType[];
  dominantContexts: ContextType[];
  reflection: string;
}

const THEME_KEYWORDS: Array<{ theme: ThemeType; keywords: string[] }> = [
  { theme: ThemeType.WORK, keywords: ["仕事", "働く", "業務", "職場", "work"] },
  { theme: ThemeType.LEARNING, keywords: ["学習", "勉強", "学び", "study", "learning"] },
  { theme: ThemeType.HEALTH, keywords: ["健康", "体調", "睡眠", "運動", "health"] },
  { theme: ThemeType.FAMILY, keywords: ["家族", "family"] },
  { theme: ThemeType.PARENTING, keywords: ["子育て", "育児", "parenting"] },
  { theme: ThemeType.SIDEBUSINESS, keywords: ["副業", "side", "business"] },
  { theme: ThemeType.CREATION, keywords: ["創作", "制作", "執筆", "作る", "creation"] },
  { theme: ThemeType.AI, keywords: ["AI", "人工知能", "生成ai", "generative ai"] },
  { theme: ThemeType.ENGLISH, keywords: ["英語", "english"] },
  { theme: ThemeType.HOBBY, keywords: ["趣味", "hobby"] },
];

function inferTheme(text: string): ThemeType | null {
  const normalized = text.toLowerCase();

  for (const { theme, keywords } of THEME_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return theme;
    }
  }

  return null;
}

/**
 * Yohaku Generator
 * 直近72時間のデータから、人生の文脈を可視化する。
 */
async function getRawYohaku(userId: string): Promise<YohakuResult> {
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  // 1. 直近データの取得
  const [memories, dialogues, connections] = await Promise.all([
    prisma.contentItem.findMany({
      where: { userId, createdAt: { gte: seventyTwoHoursAgo } },
      select: CONTENT_ITEM_SAFE_SELECT,
    }),
    prisma.companionMessage.findMany({
      where: { 
        conversation: { userId },
        role: "user",
        createdAt: { gte: seventyTwoHoursAgo }
      },
      select: { content: true },
      take: 10,
    }),
    prisma.memoryConnection.findMany({
      where: {
        source: { userId },
        createdAt: { gte: seventyTwoHoursAgo }
      },
      select: { contextType: true },
    })
  ]);

  // 2. Theme 集計
  const themeCounts: Record<string, number> = {};
  memories.forEach(m => {
    const sourceText = [
      m.title,
      m.summary,
      ...(m.aiTags ?? []),
    ].filter(Boolean).join(" ");
    const inferredTheme = inferTheme(sourceText);
    if (inferredTheme) {
      themeCounts[inferredTheme] = (themeCounts[inferredTheme] || 0) + 1;
    }
  });
  const dominantThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([theme]) => theme as ThemeType);

  // 3. Context 集計
  const contextCounts: Record<string, number> = {};
  connections.forEach(c => {
    if (c.contextType) contextCounts[c.contextType] = (contextCounts[c.contextType] || 0) + 1;
  });
  const dominantContexts = Object.entries(contextCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([context]) => context as ContextType);

  // 4. AI プロンプト構築
  const memoryTitles = memories.map(m => `・${m.title}`).join("\n");
  const dialogueSnippets = dialogues.map(d => `・${d.content.slice(0, 30)}...`).join("\n");

  const prompt = `
最近のテーマ: ${dominantThemes.join(", ")}
最近の文脈: ${dominantContexts.join(", ")}

最近の記憶:
${memoryTitles}

最近の対話:
${dialogueSnippets}

上記のデータに基づき、ユーザーが自分自身と向き合うための「気づき（Reflection）」を生成してください。

条件:
- 120文字以内
- 前向きすぎず、落ち着いたトーン
- 説教、アドバイス、解決の提案は絶対にしない
- ユーザーの行動や思考の重なりを「鏡」のように映し出すこと
`;

  const systemInstruction = "あなたは静かな観察者です。ユーザーの断片的な記憶や言葉から、そこにある文脈をそっと掬い上げてください。目的は答えを出すことではなく、気づくためのReflectionを提供することです。";

  try {
    const response = await generateText(prompt, systemInstruction, { userId });
    return {
      dominantThemes,
      dominantContexts,
      reflection: response.text.trim(),
    };
  } catch (error) {
    console.error("[generateYohaku] error:", error);
    return {
      dominantThemes,
      dominantContexts,
      reflection: "今はまだ、静かに沈殿するのを待っている時間かもしれません。",
    };
  }
}

export async function generateYohaku(userId: string) {
  return unstable_cache(
    () => getRawYohaku(userId),
    ["yohaku-generator", userId], // ユーザー単位のキー
    { revalidate: 3600 }
  )();
}
