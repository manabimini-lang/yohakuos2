"use client";
import Link from "next/link";
import { format } from "date-fns";

type Props = {
  todaySummary?: string | null;
  eventsCount?: number;
  unreadEmails?: number;
  topPriority?: string | null;
  updatedAt?: number | null;
  changeSummary?: string | null;
};

export default function TodaySummary({
  todaySummary,
  eventsCount = 0,
  unreadEmails = 0,
  topPriority,
  updatedAt,
  changeSummary,
}: Props) {
  const updatedLabel = (() => {
    if (!updatedAt) return "未取得";
    const diff = Date.now() - updatedAt;
    const mins = Math.max(0, Math.round(diff / 60000));
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    return format(new Date(updatedAt), "yyyy/MM/dd HH:mm");
  })();

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-background to-muted/10 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Today Summary</p>
          <h3 className="mt-2 text-lg font-bold text-foreground">{todaySummary ?? "今日の要約はありません"}</h3>
          {changeSummary ? <p className="mt-2 text-sm text-muted-foreground">{changeSummary}</p> : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">今日の予定</p>
              <p className="font-medium">{eventsCount}件</p>
            </div>
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">未読メール</p>
              <p className="font-medium">{unreadEmails}件</p>
            </div>
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">最優先</p>
              <p className="font-medium truncate">{topPriority ?? "優先事項はありません"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-muted-foreground">最終更新</span>
          <span className="text-sm font-medium">{updatedLabel}</span>
          <Link href="/yui/settings" className="mt-3 inline-flex items-center rounded-full bg-background px-3 py-1 text-xs border border-border">設定</Link>
        </div>
      </div>
    </div>
  );
}
