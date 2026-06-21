/**
 * YOHAKU Inquiry Compass
 *
 * 「今、どんな学び方をしているか」を映すエンジン。
 *
 * Inquiry Flow（YOHAKU独自モデル）:
 *   Capture → Sense → Question → Challenge → Express → Reflect → Capture …
 *
 * 特定のフレームワーク（PDCA, OODA, Kolb 等）を採用しない。
 * 学びに共通する循環を、ユーザーの行動シグナルから静かに読み取る。
 *
 * DB変更なし。新規テーブルなし。保存なし。すべて動的生成。
 */

import { prisma } from "@/lib/prisma";
import { resolveProvider } from "@/lib/ai/provider-resolver";
import type { ContextProfile } from "@/lib/ai/context-engine";
import type { LearningCompass } from "@/lib/ai/generate-learning-compass";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────

export type InquiryPhase =
  | "capture"
  | "sense"
  | "question"
  | "challenge"
  | "express"
  | "reflect";

export type InquiryCompass = {
  dominantPhase: InquiryPhase;
  weakPhase: InquiryPhase;
  narrative: string;
};

export interface InquiryCompassInput {
  userId: string;
  contextProfile: ContextProfile;
  learningCompass?: LearningCompass | null;
}

// ───────────────────────────────────────────
// Phase Signals — 各フェーズの行動強度を計測
// ───────────────────────────────────────────

interface PhaseScores {
  capture: number;
  sense: number;
  question: number;
  challenge: number;
  express: number;
  reflect: number;
}

const PHASE_ORDER: InquiryPhase[] = [
  "capture",
  "sense",
  "question",
  "challenge",
  "express",
  "reflect",
];

async function measurePhaseScores(userId: string): Promise<PhaseScores> {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    // Capture: URL/PDF/メモの保存数
    captureCount,
    // Sense: AI処理済み（summary, tags が付与された）コンテンツ数
    senseCount,
    // Question: Reflectionテキストが入力された数 + 対話での問いかけ数
    reflectionInputCount,
    conversationQuestionCount,
    // Challenge: QuietPlan作成数 + DailyLogの smallAction 記録数
    quietPlanCount,
    dailyActionCount,
    // Express: 対話メッセージ送信数 + ExternalContent共有数
    conversationMessageCount,
    externalShareCount,
    // Reflect: AudioReflection再生数 + ContentItem閲覧数（viewCount > 0）
    audioCompletedCount,
    revisitedContentCount,
  ] = await Promise.all([
    // ── Capture ──
    prisma.contentItem.count({
      where: { userId, createdAt: { gte: fourteenDaysAgo } },
    }),

    // ── Sense ──
    prisma.contentItem.count({
      where: {
        userId,
        createdAt: { gte: fourteenDaysAgo },
        aiProcessedAt: { not: null },
      },
    }),

    // ── Question (reflection入力) ──
    prisma.contentItem.count({
      where: {
        userId,
        createdAt: { gte: fourteenDaysAgo },
        reflection: { not: null },
      },
    }),

    // ── Question (対話での問い) ──
    prisma.companionMessage.count({
      where: {
        conversation: { userId },
        role: "user",
        createdAt: { gte: fourteenDaysAgo },
      },
    }),

    // ── Challenge (QuietPlan) ──
    prisma.quietPlan.count({
      where: { userId, createdAt: { gte: fourteenDaysAgo } },
    }),

    // ── Challenge (DailyLog with smallAction) ──
    prisma.dailyLog.count({
      where: {
        userId,
        createdAt: { gte: fourteenDaysAgo },
        smallAction: { not: null },
      },
    }),

    // ── Express (対話メッセージ) ──
    prisma.companionMessage.count({
      where: {
        conversation: { userId },
        role: "user",
        createdAt: { gte: fourteenDaysAgo },
      },
    }),

    // ── Express (外部共有) ──
    prisma.externalContent.count({
      where: { createdBy: userId, createdAt: { gte: fourteenDaysAgo } },
    }),

    // ── Reflect (音声振り返り) ──
    prisma.audioReflection.count({
      where: {
        userId,
        status: "completed",
        createdAt: { gte: fourteenDaysAgo },
      },
    }),

    // ── Reflect (再閲覧) ──
    prisma.contentItem.count({
      where: {
        userId,
        lastViewedAt: { gte: fourteenDaysAgo },
        viewCount: { gte: 2 },
      },
    }),
  ]);

  return {
    capture: captureCount,
    sense: senseCount,
    question: reflectionInputCount + conversationQuestionCount,
    challenge: quietPlanCount + dailyActionCount,
    express: conversationMessageCount + externalShareCount,
    reflect: audioCompletedCount + revisitedContentCount,
  };
}

// ───────────────────────────────────────────
// Phase determination
// ───────────────────────────────────────────

function determineDominantAndWeak(scores: PhaseScores): {
  dominant: InquiryPhase;
  weak: InquiryPhase;
} {
  let maxScore = -1;
  let minScore = Infinity;
  let dominant: InquiryPhase = "capture";
  let weak: InquiryPhase = "reflect";

  for (const phase of PHASE_ORDER) {
    const score = scores[phase];
    if (score > maxScore) {
      maxScore = score;
      dominant = phase;
    }
    if (score < minScore) {
      minScore = score;
      weak = phase;
    }
  }

  // dominant と weak が同じにならないようにする
  if (dominant === weak) {
    // 全てのスコアが同一 → デフォルト
    dominant = "capture";
    weak = "question";
  }

  return { dominant, weak };
}

// ───────────────────────────────────────────
// Narrative generation
// ───────────────────────────────────────────

const NARRATIVE_SYSTEM_PROMPT = `あなたはユーザーの「学びの循環を映す鏡」です。
教師でも評価者でもコーチでもありません。

ユーザーが今どのような学び方をしているかを、静かに、押し付けず、観察結果として伝えてください。

【厳守ルール】
- 「あなたはQuestionフェーズです」のようなラベル付けをしない
- 「次はChallengeに進みましょう」のような指示をしない
- 「PDCAのDoが不足しています」のようなフレームワーク用語を使わない
- フェーズ名（Capture, Sense 等）をそのまま出力しない。自然な日本語で言い換える
- 2〜3段落、150〜250文字程度
- 静かで間のあるトーン`;

async function generateNarrative(
  userId: string,
  scores: PhaseScores,
  dominant: InquiryPhase,
  weak: InquiryPhase,
  contextProfile: ContextProfile
): Promise<string> {
  const phaseLabels: Record<InquiryPhase, string> = {
    capture: "情報を集めること",
    sense: "集めた情報を整理し意味づけすること",
    question: "問いを持つこと",
    challenge: "小さく試してみること",
    express: "考えを表現し共有すること",
    reflect: "立ち止まって振り返ること",
  };

  try {
    const provider = await resolveProvider(userId);
    if (!provider) return buildFallbackNarrative(dominant, weak, phaseLabels);

    const prompt = `
[ユーザーの直近14日間の学び方の傾向]
- 情報を集める活動: ${scores.capture}回
- 整理・意味づけの活動: ${scores.sense}回
- 問いや内省の活動: ${scores.question}回
- 実践・検証の活動: ${scores.challenge}回
- 表現・共有の活動: ${scores.express}回
- 振り返りの活動: ${scores.reflect}回

[最も活発な活動]
${phaseLabels[dominant]}

[最も少ない活動]
${phaseLabels[weak]}

[学びの文脈]
- 続いているテーマ: ${contextProfile.recurringThemes.join(", ") || "特になし"}
- 現れ始めたテーマ: ${contextProfile.emergingThemes.join(", ") || "特になし"}

上記の観察結果から、ユーザーの今の学び方の傾向を静かに映し出すナラティブを生成してください。
フェーズ名を直接使わず、自然な日本語で伝えてください。
`;

    const narrative = await provider.generateInsight(NARRATIVE_SYSTEM_PROMPT, prompt);
    if (narrative) return narrative;
  } catch (error) {
    console.error("[generateInquiryCompass] Narrative generation failed:", error);
  }

  return buildFallbackNarrative(dominant, weak, phaseLabels);
}

function buildFallbackNarrative(
  dominant: InquiryPhase,
  weak: InquiryPhase,
  labels: Record<InquiryPhase, string>
): string {
  return `最近の記録を見ると、${labels[dominant]}に重心が置かれているようです。\n\n一方で、${labels[weak]}の記録はまだ少ないように見えます。\n\nどちらが良いということではなく、今の学びの流れがそうなっているということです。`;
}

// ───────────────────────────────────────────
// Public API
// ───────────────────────────────────────────

export async function generateInquiryCompass(
  input: InquiryCompassInput
): Promise<InquiryCompass> {
  const { userId, contextProfile } = input;

  const scores = await measurePhaseScores(userId);
  const { dominant, weak } = determineDominantAndWeak(scores);
  const narrative = await generateNarrative(userId, scores, dominant, weak, contextProfile);

  return {
    dominantPhase: dominant,
    weakPhase: weak,
    narrative,
  };
}
