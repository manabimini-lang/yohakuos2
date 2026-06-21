/**
 * YOHAKU Companion Decision Engine
 *
 * 「どの関わり方が、今のユーザーにとって最も自然か」を判断するエンジン。
 *
 * AIではなく、ルールベースで決定する。
 * 理由：LLM呼び出しコストを避け、高速に判断するため。
 * 文脈データ（ContextProfile, LearningCompass）は上位で生成済みのものを受け取る。
 *
 * DB変更なし。新規テーブルなし。すべて動的生成。
 */

import { prisma } from "@/lib/prisma";
import type { ContextProfile } from "@/lib/ai/context-engine";
import type { LearningCompass } from "@/lib/ai/generate-learning-compass";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────

export type CompanionMode =
  | "reflection"
  | "journey"
  | "question"
  | "compass"
  | "reconnect";

export type CompanionDecision = {
  mode: CompanionMode;
  reason: string;
  /** reconnect モードの場合、再接続対象のテーマ */
  reconnectTheme?: string;
};

export interface CompanionDecisionInput {
  userId: string;
  contextProfile: ContextProfile;
  learningCompass?: LearningCompass | null;
}

// ───────────────────────────────────────────
// Signals — DB から軽量に取得するユーザー行動シグナル
// ───────────────────────────────────────────

interface UserActivitySignals {
  /** 直近7日間の保存数 */
  recentSaveCount: number;
  /** 直近7日間の対話メッセージ数 */
  recentConversationCount: number;
  /** 直近7日間の音声再生完了数（AudioReflection completed） */
  recentAudioCount: number;
  /** 直近30日間の保存数 */
  monthlySaveCount: number;
  /** 直近24時間以内に保存があるか */
  hasSavedToday: boolean;
  /** 最後の保存からの経過日数 */
  daysSinceLastSave: number;
}

async function collectActivitySignals(userId: string): Promise<UserActivitySignals> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    recentSaveCount,
    monthlySaveCount,
    recentConversationCount,
    recentAudioCount,
    latestItem,
    todaySaveCount,
  ] = await Promise.all([
    // 直近7日の保存数
    prisma.contentItem.count({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
    }),
    // 直近30日の保存数
    prisma.contentItem.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    // 直近7日の対話メッセージ数
    prisma.companionMessage.count({
      where: {
        conversation: { userId },
        role: "user",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    // 直近7日の完了済み音声数
    prisma.audioReflection.count({
      where: {
        userId,
        status: "completed",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    // 最新の保存
    prisma.contentItem.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    // 直近24時間の保存
    prisma.contentItem.count({
      where: { userId, createdAt: { gte: twentyFourHoursAgo } },
    }),
  ]);

  const daysSinceLastSave = latestItem
    ? Math.floor((now.getTime() - new Date(latestItem.createdAt).getTime()) / (24 * 60 * 60 * 1000))
    : 999;

  return {
    recentSaveCount,
    monthlySaveCount,
    recentConversationCount,
    recentAudioCount,
    hasSavedToday: todaySaveCount > 0,
    daysSinceLastSave,
  };
}

// ───────────────────────────────────────────
// Decision Logic
// ───────────────────────────────────────────

export async function decideCompanionMode(
  input: CompanionDecisionInput
): Promise<CompanionDecision> {
  const { userId, contextProfile, learningCompass } = input;
  const signals = await collectActivitySignals(userId);

  // ─── reconnect ───
  // 過去の重要テーマがしばらく現れていない
  if (contextProfile.dormantThemes.length > 0 && signals.monthlySaveCount >= 5) {
    const theme = contextProfile.dormantThemes[0];
    return {
      mode: "reconnect",
      reason: `以前繰り返し現れていた「${theme}」というテーマが、最近は記録に現れていません。`,
      reconnectTheme: theme,
    };
  }

  // ─── reflection ───
  // 保存直後 or 情報量がまだ少ない
  if (signals.hasSavedToday && signals.recentSaveCount <= 3) {
    return {
      mode: "reflection",
      reason: "新しい記録が加わったばかりです。静かに振り返る時間に適しています。",
    };
  }

  // ─── question ───
  // ユーザーが対話をよく行っている（思考を深める余地がある）
  if (signals.recentConversationCount >= 3) {
    return {
      mode: "question",
      reason: "最近対話を通じて思考を深めている様子が見えます。問いを通じてさらに掘り下げられるかもしれません。",
    };
  }

  // ─── compass ───
  // 一定期間の学びが蓄積されている（方向性を見直すタイミング）
  if (
    signals.monthlySaveCount >= 10 &&
    contextProfile.recurringThemes.length >= 2 &&
    signals.daysSinceLastSave <= 7
  ) {
    return {
      mode: "compass",
      reason: "記録が十分に蓄積されています。学びの方向性を静かに見つめ直すタイミングかもしれません。",
    };
  }

  // ─── journey ───
  // 複数の記録が蓄積されており、移動時間向きの体験を提供
  if (signals.recentSaveCount >= 3 && signals.recentAudioCount < 2) {
    return {
      mode: "journey",
      reason: "最近の記録がいくつか重なっています。学びの旅路を音声で振り返るのに良いタイミングです。",
    };
  }

  // ─── default: reflection ───
  return {
    mode: "reflection",
    reason: "静かに、これまでの記録を振り返る時間です。",
  };
}
