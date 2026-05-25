// ===================================================
// YOHAKU Life OS — Meaning Layer Engine
// ===================================================
//
// 最重要コンポーネント。
// AIが以下を抽出:
// - recurring themes (繰り返すテーマ)
// - unresolved questions (未解決の問い)
// - value tensions (価値観の葛藤)
// - long-term curiosity (長期的好奇心)
// - emotional recurrence (感情の再帰パターン)
//
// 設計原則:
// - 診断禁止: 「あなたは〜ですね」と断定しない
// - あくまで「兆し」として提示
// - YOHAKU の核: 人生の意味を静かに見守る
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { MeaningAnalysis, MeaningSignalInfo, MeaningSignalType } from "./types";
import { MEANING_SYSTEM_PROMPT } from "./prompts";

const MIN_SIGNAL_CONFIDENCE = 0.15;

/**
 * 全ユーザーの意味シグナルを取得
 */
export async function getMeaningSignals(
    userId: string,
    limit: number = 20,
    minConfidence: number = MIN_SIGNAL_CONFIDENCE
): Promise<MeaningSignalInfo[]> {
    const signals = await prisma.meaningSignal.findMany({
        where: {
            userId,
            confidence: { gte: minConfidence },
        },
        orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: {
            id: true,
            signalType: true,
            description: true,
            confidence: true,
            areaType: true,
            relatedMemoryIds: true,
            createdAt: true,
        },
    });

    return signals.map((s) => ({
        id: s.id,
        signalType: s.signalType as MeaningSignalType,
        description: s.description,
        confidence: s.confidence,
        areaType: s.areaType as any,
        relatedMemoryIds: s.relatedMemoryIds,
        createdAt: s.createdAt,
    }));
}

/**
 * AIを使って意味シグナルを抽出・生成する
 */
export async function extractMeaningSignals(
    userId: string
): Promise<MeaningAnalysis> {
    // 1. 直近のデータを収集
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentReflections, recentMemories, recentConversations, recentEnergies, recentMeanings] =
        await Promise.all([
            prisma.reflection.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { title: true, content: true, sentiment: true, createdAt: true },
            }),
            prisma.userMemory.findMany({
                where: { userId, confidence: { gte: 0.4 }, createdAt: { gte: thirtyDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 15,
                select: { type: true, title: true, content: true, createdAt: true },
            }),
            prisma.companionMessage.findMany({
                where: { role: "assistant", conversation: { userId }, createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { content: true, createdAt: true },
            }),
            prisma.energyState.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { state: true, intensity: true, note: true, createdAt: true },
            }),
            prisma.meaningSignal.findMany({
                where: { userId, confidence: { gte: 0.2 } },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { signalType: true, description: true, confidence: true },
            }),
        ]);

    // 2. データが少なすぎる場合はスキップ
    const dataPoints =
        recentReflections.length + recentMemories.length + recentConversations.length;
    if (dataPoints < 3) {
        return {
            signals: [],
            summary: "まだ意味シグナルを抽出するのに十分なデータがありません。",
            patterns: [],
            quietQuestions: ["今日はどんなことを感じましたか？"],
            confidence: 0.1,
        };
    }

    // 3. AIに意味抽出を依頼
    const dataForPrompt = [
        "【最近の内省】",
        ...recentReflections.map((r) => `- ${r.title || "無題"}: ${(r.content || "").slice(0, 150)}`),
        "",
        "【最近の気づき（記憶）】",
        ...recentMemories.map((m) => `- [${m.type}] ${m.title}: ${m.content.slice(0, 100)}`),
        "",
        "【最近の会話】",
        ...recentConversations.map((c) => `- ${c.content.slice(0, 100)}`),
        "",
        "【エネルギー状態】",
        ...recentEnergies.map((e) => `- ${e.state} (強度:${e.intensity}) ${e.note || ""}`),
        "",
        "【既存の意味シグナル】",
        ...recentMeanings.map((m) => `- [${m.signalType}] ${m.description.slice(0, 100)}`),
    ].join("\n");

    const extractionPrompt = `以下のユーザーデータから、人生における「意味の兆し」を抽出してください。

抽出する兆しの種類:
1. recurring_theme: 繰り返し現れるテーマ
2. unresolved_question: まだ答えが出ていない問い
3. value_tension: 価値観の間での葛藤
4. long_term_curiosity: 長期的な好奇心
5. emotional_recurrence: 同じ感情パターンの再帰

注意:
- 断定しないでください。「〜かもしれません」という表現を使ってください
- 診断や分析ではなく、「兆し」として提示してください
- データが少ない場合も、無理に抽出しないでください
- 各シグナルには0.0-1.0の確度をつけてください

${dataForPrompt}

以下のJSON形式で返してください:
{
  "signals": [
    {
      "signalType": "recurring_theme",
      "description": "説明（100文字以内）",
      "confidence": 0.5,
      "areaType": "Health | Learning | Work | Creativity | Relationships | Mind | Rest | Challenge | null"
    }
  ],
  "summary": "全体サマリー（100文字以内）",
  "patterns": ["気づいたパターン1", "パターン2"],
  "quietQuestions": ["静かな問い1", "静かな問い2"],
  "confidence": 0.5
}`;

    const { text } = await generateText(extractionPrompt, MEANING_SYSTEM_PROMPT);

    // 4. JSONをパース
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        const parsed = JSON.parse(jsonMatch[0]);

        const signals: MeaningSignalInfo[] = [];
        const validTypes = ["recurring_theme", "unresolved_question", "value_tension", "long_term_curiosity", "emotional_recurrence"];

        for (const s of parsed.signals || []) {
            if (!validTypes.includes(s.signalType)) continue;
            const confidence = Math.max(0, Math.min(1, s.confidence || 0.3));

            // 保存
            const created = await prisma.meaningSignal.create({
                data: {
                    userId,
                    signalType: s.signalType,
                    description: s.description.slice(0, 500),
                    confidence,
                    areaType: s.areaType || null,
                    relatedMemoryIds: [],
                },
            });

            signals.push({
                id: created.id,
                signalType: s.signalType,
                description: created.description,
                confidence,
                areaType: created.areaType as any,
                relatedMemoryIds: [],
                createdAt: created.createdAt,
            });
        }

        return {
            signals,
            summary: parsed.summary || "意味の兆しを抽出しました。",
            patterns: parsed.patterns || [],
            quietQuestions: parsed.quietQuestions || [],
            confidence: parsed.confidence || 0.3,
        };
    } catch {
        // パース失敗時は空の結果を返す
        return {
            signals: [],
            summary: "意味シグナルの抽出を試みましたが、現時点では明確なパターンは見つかりませんでした。",
            patterns: [],
            quietQuestions: ["何か気になることはありますか？"],
            confidence: 0.1,
        };
    }
}

/**
 * 蓄積された意味シグナルから分析を生成
 */
export async function analyzeMeaningSignals(
    userId: string
): Promise<MeaningAnalysis> {
    const signals = await getMeaningSignals(userId, 30, 0.15);

    if (signals.length === 0) {
        return {
            signals: [],
            summary: "まだ意味シグナルが蓄積されていません。",
            patterns: [],
            quietQuestions: ["最近、心に残っていることはありますか？"],
            confidence: 0.1,
        };
    }

    // シグナルをタイプごとにグループ化
    const byType: Record<string, MeaningSignalInfo[]> = {};
    for (const s of signals) {
        if (!byType[s.signalType]) byType[s.signalType] = [];
        byType[s.signalType].push(s);
    }

    // パターンを抽出
    const patterns: string[] = [];
    for (const [type, sigs] of Object.entries(byType)) {
        if (sigs.length >= 2) {
            const labels: Record<string, string> = {
                recurring_theme: "繰り返し現れるテーマ",
                unresolved_question: "未解決の問い",
                value_tension: "価値観の葛藤",
                long_term_curiosity: "長期的好奇心",
                emotional_recurrence: "感情の再帰パターン",
            };
            patterns.push(`${labels[type] || type}が${sigs.length}件見つかりました`);
        }
    }

    // 高確度シグナルから静かな問いを生成
    const highConfidence = signals.filter((s) => s.confidence >= 0.4);
    const quietQuestions = highConfidence.length > 0
        ? highConfidence.slice(0, 3).map((s) => {
            const questions: Record<string, string> = {
                recurring_theme: `「${s.description.slice(0, 30)}」というテーマ、最近意識していますか？`,
                unresolved_question: `「${s.description.slice(0, 30)}」について、何か新しい視点はありますか？`,
                value_tension: `「${s.description.slice(0, 30)}」、どちらも大切にできますか？`,
                long_term_curiosity: `「${s.description.slice(0, 30)}」への興味、今も続いていますか？`,
                emotional_recurrence: `「${s.description.slice(0, 30)}」という感覚、何か気づきはありますか？`,
            };
            return questions[s.signalType] || s.description.slice(0, 50);
        })
        : ["今、どんなことが心にありますか？"];

    return {
        signals,
        summary: `${signals.length}件の意味シグナルが見つかりました。${patterns.length > 0 ? patterns.join("、") : "特に顕著なパターンはありません。"}`,
        patterns,
        quietQuestions,
        confidence: signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length,
    };
}