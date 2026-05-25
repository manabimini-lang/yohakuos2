// ===================================================
// YOHAKU Calm Infrastructure — Trust Layer
// ===================================================
//
// ユーザーが「人生データを安心して預けられる」ための仕組み。
// - explainable AI（なぜこのインサイト？）
// - confidence display（確度の可視化）
// - privacy transparency（データ利用の透明性）
// - why this insight（インサイトの説明）
//

export interface Explanation {
    reason: string;
    sourceType: string;
    sourceCount: number;
    confidence: number;
    dataPoints: string[];
    generatedAt: Date;
}

/**
 * インサイトの生成理由を説明する
 */
export function explainInsight(
    insightType: string,
    confidence: number,
    sourceMemoryIds: string[]
): Explanation {
    const explanations: Record<string, string> = {
        seasonal_echo: "同じ季節の過去データとの繋がりを検出しました",
        memory_resonance: "現在の状態と共鳴する過去の記憶が見つかりました",
        reflection_bridge: "複数の内省に共通するテーマを発見しました",
        theme_recurrence: "繰り返し現れるテーマのパターンを検出しました",
        quiet_discovery: "最近のデータから小さな気づきを得ました",
        recurring_theme: "このテーマは以前から繰り返し現れています",
        unresolved_question: "まだ答えが出ていない問いがありそうです",
        value_tension: "価値観の間で葛藤があるかもしれません",
        long_term_curiosity: "長期的に関心を持ち続けているテーマです",
        emotional_recurrence: "同じ感情パターンが繰り返し現れています",
    };

    return {
        reason: explanations[insightType] || "データ分析に基づく気づきです",
        sourceType: insightType,
        sourceCount: sourceMemoryIds.length,
        confidence,
        dataPoints: [],
        generatedAt: new Date(),
    };
}

/**
 * 確度に応じた表示ラベルを取得
 */
export function getConfidenceLabel(confidence: number): {
    label: string;
    description: string;
    level: "low" | "medium" | "high" | "very_high";
} {
    if (confidence >= 0.7) {
        return {
            label: "高い確度",
            description: "複数のデータが一致しています",
            level: "very_high",
        };
    }
    if (confidence >= 0.5) {
        return {
            label: "確度あり",
            description: "ある程度の根拠があります",
            level: "high",
        };
    }
    if (confidence >= 0.3) {
        return {
            label: "兆し",
            description: "弱いシグナルですが、注目しています",
            level: "medium",
        };
    }
    return {
        label: "小さな兆し",
        description: "まだ確かなことではありませんが、記録しています",
        level: "low",
    };
}

/**
 * プライバシー透明性のためのデータ利用説明
 */
export function getDataUsageExplanation(): {
    what: string;
    how: string;
    retention: string;
    control: string;
} {
    return {
        what: "あなたの内省、学び、感情状態、会話の内容を使用します",
        how: "AIがパターンを検出し、人生の流れを静かに観察するために使用します",
        retention: "データは安全に保存され、いつでも削除できます",
        control: "設定からAI分析をオフにすることができます",
    };
}

/**
 * 低確度であることを明示する文言
 */
export function getLowConfidenceDisclaimer(confidence: number): string | null {
    if (confidence < 0.3) {
        return "これはまだ小さな兆しです。時間とともにはっきりするかもしれません。";
    }
    if (confidence < 0.5) {
        return "これは一つの可能性として見てください。あなた自身の感覚が最も大切です。";
    }
    return null;
}