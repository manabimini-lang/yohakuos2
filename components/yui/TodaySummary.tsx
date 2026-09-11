"use client";
import Link from "next/link";
import { format } from "date-fns";

type Props = {
  calendarStatus?: "connected" | "disconnected" | "checking" | "unavailable";
  gmailStatus?: "connected" | "disconnected" | "checking" | "unavailable";
  todaySummary?: string | null;
  eventsCount?: number;
  actionableEmails?: number;
  topPriority?: string | null;
  selectedGoal?: string | null;
  priorityReason?: string | null;
  updatedAt?: number | null;
  changeSummary?: string | null;
};

export default function TodaySummary({
  calendarStatus = "checking",
  gmailStatus = "checking",
  todaySummary,
  eventsCount = 0,
  actionableEmails = 0,
  topPriority,
  selectedGoal,
  priorityReason,
  updatedAt,
  changeSummary,
}: Props) {
  const calendarConnected = calendarStatus === "connected";
  const gmailConnected = gmailStatus === "connected";
  const connectionLabel = (status: "connected" | "disconnected" | "checking" | "unavailable", count: number) => {
    if (status === "connected") return `${count}件`;
    if (status === "checking") return "確認中";
    if (status === "unavailable") return "確認できません";
    return "未接続・未確認";
  };
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
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">今日の予定と優先事項</p>
          <h3 className="mt-2 text-lg font-bold text-foreground">{calendarConnected && gmailConnected ? (todaySummary ?? "今日の要約はありません") : "外部サービスの情報は、接続・取得できた範囲で表示します。"}</h3>
          {calendarConnected && gmailConnected && changeSummary ? <p className="mt-2 text-sm text-muted-foreground">{changeSummary}</p> : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">今日の予定</p>
              <p className="font-medium">{connectionLabel(calendarStatus, eventsCount)}</p>
            </div>
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">要確認メール</p>
              <p className="font-medium">{connectionLabel(gmailStatus, actionableEmails)}</p>
            </div>
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">YUIの優先候補</p>
              <p className="font-medium truncate">{topPriority ?? "優先事項はありません"}</p>
              {topPriority && priorityReason ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {selectedGoal && selectedGoal !== topPriority ? `選択中の目的「${selectedGoal}」とは別の候補です。` : ""}
                  候補の理由：{priorityReason}
                </p>
              ) : selectedGoal && topPriority && selectedGoal !== topPriority ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">選択中の目的「{selectedGoal}」とは別の候補です。希望する曜日や時間に合うか確認してから選んでください。</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
            <span className="text-xs text-muted-foreground">最終更新</span>
            <span className="text-sm font-medium">{updatedLabel}</span>
          </div>
          <Link href="/yui/settings" className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs">設定</Link>
        </div>
      </div>
    </div>
  );
}
