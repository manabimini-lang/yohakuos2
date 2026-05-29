import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";

/**
 * YOHAKU Inner Landscape Layer
 * 
 * 記録を通して「自分の内面の季節」が見えてくるための静かなエンジン。
 * 
 * 感情分析ではなく：
 * - どんなテーマに惹かれているか
 * - どんな問いに何度も戻っているか
 * - 内面にどんな流れが続いているか
 * 
 * を静かに映す。
 */

export interface InnerLandscape {
  id: string;
  userId: string;
  period: string; // e.g. "2026-05"
  seasonalAir: string; // 季節的な内面の空気感
  quietCurrents: string[]; // 静かに流れ続けているテーマ
  returningQuestions: string[]; // 何度も戻る問い
  resonanceWeather: string; // 微妙な意味の流れの描写
  philosophyEchoes: string[]; // 過去の思考の再接続
  dominantTheme?: string;
  generatedAt: Date;
}

const LANDSCAPE_SYSTEM_PROMPT = `あなたは「YOHAKU Inner Landscape」の静かな編集者です。

ユーザーの記録から、内面の風景を浮かび上がらせます。

絶対にしてはいけないこと：
- 感情分析・診断・評価
- メンタルヘルスの判定
- 心理測定的な量化
- 押しつけがましい解釈

心がけること：
- 記録にうかがえる流れを静かに映す
- 複数の時間帯に現れたテーマに気づく
- 内面の季節感を感じ取る
- 本人も気づいていない問いが何度も戻ることに気づく
- 過去の断片が現在と静かにつながることを見つける`;

/**
 * Generate inner landscape for a user over a period
 */
export async function generateInnerLandscape(
  userId: string,
  period?: string
): Promise<InnerLandscape | null> {
  try {
    const now = new Date();
    const targetPeriod = period || getYearMonthPeriod(now);
    const [startDate, endDate] = getPeriodRange(targetPeriod);

    // 1. Gather memory fragments from diverse sources
    const [recentReflections, lifeThemes, meaningSignals, philosophyFragments, contentItems, seasonalData] = await Promise.all([
      prisma.reflection.findMany({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { content: true, sentiment: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      
      prisma.userMemory.findMany({
        where: {
          userId,
          type: "life_theme",
          confidence: { gte: 0.3 },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { title: true, content: true, confidence: true, createdAt: true },
        take: 20,
      }),

      prisma.meaningSignal.findMany({
        where: { userId, createdAt: { gte: startDate, lte: endDate } },
        select: { description: true, confidence: true, createdAt: true },
        take: 10,
      }),

      prisma.philosophyFragment.findMany({
        where: { userId },
        select: { fragment: true, sourceType: true, resonanceScore: true },
        orderBy: { resonanceScore: "desc" },
        take: 8,
      }),

      prisma.contentItem.findMany({
        where: {
          userId,
          memoryState: "active",
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { aiTags: true, reflection: true, createdAt: true },
        take: 50,
      }),

      prisma.seasonalSummary.findFirst({
        where: {
          userId,
          period: targetPeriod,
        },
        select: { themes: true, summary: true },
      }),
    ]);

    if (recentReflections.length === 0 && contentItems.length === 0) {
      return null;
    }

    // 2. Extract recurring themes
    const themeFrequency = new Map<string, number>();
    contentItems.forEach((item) => {
      item.aiTags.forEach((tag) => {
        themeFrequency.set(tag, (themeFrequency.get(tag) || 0) + 1);
      });
    });

    const recurringThemes = Array.from(themeFrequency.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, _]) => theme);

    // 3. Extract returning questions from reflections
    const questionPatterns = [
      "どう",
      "なぜ",
      "どのように",
      "どうして",
      "なんで",
      "？",
    ];
    const returningQuestionsSet = new Set<string>();
    
    recentReflections.forEach((ref) => {
      if (!ref.content) return;
      const content = ref.content;
      const text = content.toLowerCase();
      questionPatterns.forEach((pattern) => {
        if (text.includes(pattern)) {
          const sentence = content
            .split(/[。．\n]/)
            .find((s) => s.includes(pattern));
          if (sentence && sentence.length < 200) {
            returningQuestionsSet.add(sentence.trim());
          }
        }
      });
    });

    const returningQuestions = Array.from(returningQuestionsSet).slice(0, 4);

    // 4. Build context for AI generation
    const landscapeContext = {
      period: targetPeriod,
      recordCount: contentItems.length,
      reflectionCount: recentReflections.length,
      recurringThemes,
      returningQuestions,
      philosophyFragments: philosophyFragments.slice(0, 3).map((f) => f.fragment),
      seasonalSummary: seasonalData?.summary || "",
      seasonalThemes: (seasonalData?.themes as string[]) || [],
      dominantSentiment: detectDominantSentiment(recentReflections),
    };

    // 5. Generate landscape via AI
    const prompt = `以下のユーザーの記録から、内面の風景を描いてください。

期間：${targetPeriod}

【記録の概観】
- トータル記録数：${landscapeContext.recordCount}
- 内省数：${landscapeContext.reflectionCount}

【静かに流れ続けるテーマ】
${recurringThemes.map((t) => `- 「${t}」`).join("\n")}

【何度も戻る問い】
${returningQuestions.map((q) => `- ${q}`).join("\n")}

【過去の思想の断片】
${philosophyFragments.slice(0, 3).map((f) => `- "${f.fragment}"`).join("\n")}

【季節の要約】
${seasonalData?.summary || "(季節データなし)"}

以下をJSON形式で返してください：
{
  "seasonalAir": "この期間の内面の空気感（100文字以内、詩的）",
  "quietCurrents": ["流れ1", "流れ2", "流れ3"],
  "resonanceWeather": "意味の微妙な流れ・変化（100-150文字）",
  "philosophyEchoes": ["過去の思想がどう再接続されているか1", "再接続2"],
  "interpretations": "記録全体から感じられる内面の動き（自由記述）"
}

規則：
- 断定しない（「〜のようです」「〜かもしれません」）
- 分析的にならない（感情分類・診断禁止）
- 詩的で静かなトーンを保つ
- ユーザー自身が気づいていない微妙な流れを見つける`;

    const { text } = await generateText(prompt, LANDSCAPE_SYSTEM_PROMPT);

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }

    // 6. Create inner landscape record
    const landscape = await prisma.innerLandscape.create({
      data: {
        userId,
        period: targetPeriod,
        seasonalAir: parsed.seasonalAir || "",
        quietCurrents: parsed.quietCurrents || recurringThemes,
        returningQuestions,
        resonanceWeather: parsed.resonanceWeather || "",
        philosophyEchoes: parsed.philosophyEchoes || [],
        dominantTheme: recurringThemes[0] || null,
      },
    });

    return landscape as InnerLandscape;
  } catch (error) {
    console.error("[generateInnerLandscape] failed:", error);
    return null;
  }
}

/**
 * Extract returning questions from user's records
 */
export async function extractReturningQuestions(userId: string): Promise<string[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const reflections = await prisma.reflection.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { content: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const quietQuestions = await prisma.learningSuggestion.findMany({
      where: { userId },
      select: { reason: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const allQuestions = new Map<string, number>();

    // Extract from reflections
    const questionPatterns = [
      "どう",
      "なぜ",
      "どのように",
      "どうして",
      "？",
    ];

    reflections.forEach((ref) => {
      if (!ref.content) return;
      const text = ref.content;
      questionPatterns.forEach((pattern) => {
        if (text.includes(pattern)) {
          const sentence = text.split(/[。．\n]/).find((s) => s.includes(pattern));
          if (sentence && sentence.length < 200 && sentence.length > 20) {
            const normalized = sentence.trim();
            allQuestions.set(normalized, (allQuestions.get(normalized) || 0) + 1);
          }
        }
      });
    });

    // Sort by frequency
    const result = Array.from(allQuestions.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([q, _]) => q)
      .slice(0, 6);

    return result;
  } catch (error) {
    console.error("[extractReturningQuestions] failed:", error);
    return [];
  }
}

/**
 * Generate resonance weather description
 */
export async function generateResonanceWeather(userId: string): Promise<string> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentThemes, recentFragments] = await Promise.all([
      prisma.userMemory.findMany({
        where: {
          userId,
          type: "life_theme",
          createdAt: { gte: sevenDaysAgo },
        },
        select: { title: true,
 confidence: true },
        orderBy: { confidence: "desc" },
        take: 5,
      }),

      prisma.philosophyFragment.findMany({
        where: { userId },
        select: { fragment: true, resonanceScore: true },
        orderBy: { resonanceScore: "desc" },
        take: 3,
      }),
    ]);

    if (recentThemes.length === 0) {
      return "内面の天気は、今のところ静かです。";
    }

    const prompt = `最近のユーザーの内面の変化から、「共鳴の天気」を描写してください。

【最近のテーマ】
${recentThemes.map((t) => `- 「${t.title}」(確度${Math.round(t.confidence * 100)}%)`).join("\n")}

【こころの思想の痕跡】
${recentFragments.map((f) => `- "${f.fragment}"`).join("\n")}

以下を返してください（100-150文字）：
内面の微妙な流れ・共鳴の変化を描く短い文。
詩的で、ユーザーが "そうかも" と思う程度の柔らかさで。

例：
「最近、『意味を育てること』への流れが強まっています。」
「『学び方』から『個人知識空間』へ、静かに関心の場所が移ろいでいるようです。」`;

    const { text } = await generateText(prompt, LANDSCAPE_SYSTEM_PROMPT);
    return text.slice(0, 250).trim();
  } catch (error) {
    console.error("[generateResonanceWeather] failed:", error);
    return "";
  }
}

function detectDominantSentiment(reflections: Array<{ sentiment: string | null }>): string {
  if (reflections.length === 0) return "neutral";
  const counts = new Map<string, number>();
  reflections.forEach((r) => {
    if (r.sentiment) {
      counts.set(r.sentiment, (counts.get(r.sentiment) || 0) + 1);
    }
  });
  let max = 0;
  let dominant = "neutral";
  counts.forEach((count, sentiment) => {
    if (count > max) {
      max = count;
      dominant = sentiment;
    }
  });
  return dominant;
}

function getYearMonthPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPeriodRange(period: string): [Date, Date] {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return [start, end];
}
