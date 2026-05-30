type StarterJourneyBannerProps = {
  remainingHours: number;
  remainingMinutes: number;
};

export function StarterJourneyBanner({ remainingHours, remainingMinutes }: StarterJourneyBannerProps) {
  const isUrgent = remainingHours <= 6;
  const title = isUrgent
    ? "スターター体験、残りわずかです。"
    : "72時間のスターター体験中です。";

  const message = isUrgent
    ? "この体験はあと数時間で終了します。静かな価値体験をじっくり味わってください。"
    : remainingHours <= 24
    ? "あと24時間以内にこのスターター体験は終了します。今のうちに静かに深めてみてください。"
    : "Gemini接続前の体験が進行中です。記録を保存すると、AIが静かに整理を始めます。";

  const timeLabel = `${remainingHours}時間${remainingMinutes.toString().padStart(2, "0")}分`;

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-slate-50/90 p-6 text-slate-900 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold tracking-wide uppercase text-slate-700">
          {title}
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-medium text-white">
          <span>残り</span>
          <span className="font-mono">{timeLabel}</span>
        </div>
      </div>
    </div>
  );
}
