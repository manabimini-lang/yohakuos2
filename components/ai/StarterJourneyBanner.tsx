/**
 * StarterJourneyBanner
 *
 * 72時間スターター体験（STARTER_GEMINI_API_KEYを使った無料AI試用）が
 * アクティブなユーザーに対して残り時間を表示するバナー。
 */

import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";

interface StarterJourneyBannerProps {
  remainingHours: number;
  remainingMinutes: number;
}

export function StarterJourneyBanner({
  remainingHours,
  remainingMinutes,
}: StarterJourneyBannerProps) {
  const timeLabel =
    remainingHours > 0
      ? `残り ${remainingHours}時間 ${remainingMinutes}分`
      : `残り ${remainingMinutes}分`;

  return (
    <div className="p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <Clock className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium tracking-wide">スターター体験中 — {timeLabel}</span>
      </div>
      <p className="text-sm text-black/70 dark:text-foreground/70 leading-relaxed font-light">
        現在、YOHAKUのシステムキーでAIを体験いただいています。
        体験期間終了後も継続してご利用いただくには、ご自身のGemini APIキーをご登録ください。
      </p>
      <Link
        href="/yui/settings"
        className="inline-flex items-center text-xs font-light text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors group"
      >
        APIキーを設定する
        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
