"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Bell, Clock, Send, CheckCircle2 } from "lucide-react";
import type { YuiNotificationPreview, YuiNotificationDeliveryStatus } from "@/app/ui/backend/yui/models";

export function YuiNotificationPreviewCard() {
  const [previews, setPreviews] = useState<{
    morning: YuiNotificationPreview;
    evening: YuiNotificationPreview;
  } | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<YuiNotificationDeliveryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prevRes, statusRes] = await Promise.all([
        fetch("/api/yui/notifications/preview"),
        fetch("/api/yui/notifications/status"),
      ]);

      if (prevRes.ok) {
        const prevData = await prevRes.json();
        setPreviews(prevData);
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDeliveryStatus(statusData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "通知情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleTestTrigger = async (type: "morning" | "evening") => {
    setTriggering(type);
    setTriggerMsg(null);
    try {
      const res = await fetch("/api/yui/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        setTriggerMsg(`${type === "morning" ? "朝" : "夜"}通知のテスト配信ログを記録しました。`);
        await fetchData();
      }
    } catch (e) {
      console.error("Failed to trigger test notification", e);
    } finally {
      setTriggering(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        通知プレビュー・配信スケジュールを生成しています...
      </Card>
    );
  }

  if (error || !previews) {
    return (
      <Card className="p-6 text-sm text-amber-800 border-amber-200 bg-amber-50">
        {error ?? "プレビューを読み込めませんでした"}
      </Card>
    );
  }

  return (
    <Card className="space-y-6 p-6 md:p-8 border-primary/20 bg-background/90 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Notification Schedule & Preview</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            YUIから配信予定の通知スケジュールとメッセージイメージです。
          </p>
        </div>
        {deliveryStatus && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              次回通知予定: {deliveryStatus.nextDeliveryTime || "未定"}
            </span>
          </div>
        )}
      </div>

      {/* Schedule Banner */}
      {deliveryStatus && (
        <div className="grid gap-3 sm:grid-cols-2 text-xs md:text-sm">
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              朝の配信予定
            </span>
            <p className="font-semibold text-foreground text-base">
              {deliveryStatus.morningTime} (JST)
            </p>
            {deliveryStatus.isTodayMorningDelivered && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                本日配信済み
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              夜の配信予定
            </span>
            <p className="font-semibold text-foreground text-base">
              {deliveryStatus.eveningTime} (JST)
            </p>
            {deliveryStatus.isTodayEveningDelivered && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                本日配信済み
              </span>
            )}
          </div>
        </div>
      )}

      {triggerMsg && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 font-medium">
          {triggerMsg}
        </div>
      )}

      <div className="space-y-6 pt-2">
        {/* Morning Brief Preview */}
        <div className="rounded-2xl border border-border bg-background p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Bell className="h-4 w-4" />
              朝の通知メッセージ ({deliveryStatus?.morningTime || "07:30"})
            </div>
            <button
              type="button"
              disabled={triggering === "morning"}
              onClick={() => void handleTestTrigger("morning")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/40 transition"
            >
              <Send className="h-3 w-3" />
              {triggering === "morning" ? "送信中..." : "テスト配信"}
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground">{previews.morning.title}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {previews.morning.message}
          </p>
        </div>

        {/* Evening Reflection Preview */}
        <div className="rounded-2xl border border-border bg-background p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Bell className="h-4 w-4" />
              夜の通知メッセージ ({deliveryStatus?.eveningTime || "21:00"})
            </div>
            <button
              type="button"
              disabled={triggering === "evening"}
              onClick={() => void handleTestTrigger("evening")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/40 transition"
            >
              <Send className="h-3 w-3" />
              {triggering === "evening" ? "送信中..." : "テスト配信"}
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground">{previews.evening.title}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {previews.evening.message}
          </p>
        </div>
      </div>
    </Card>
  );
}
