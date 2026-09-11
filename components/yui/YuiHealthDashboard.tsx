"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Sparkles, Bell, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

import { loadYuiHealth, type HealthStatus, type SystemHealth } from "@/lib/yui-health";

export function YuiHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth>({
    googleCalendar: { status: "loading", detail: "確認中…" },
    aiIntegration: { status: "loading", detail: "確認中…", mode: "取得中" },
    notifications: { status: "loading", detail: "確認中…" },
  });
  const [refreshing, setRefreshing] = useState(false);
  const checkHealth = async () => {
    setRefreshing(true);
    try {
      setHealth(await loadYuiHealth());
    } finally {
      setRefreshing(false);
    }
  };


  useEffect(() => {
    void checkHealth();
  }, []);

  const renderBadge = (status: HealthStatus, area: "google" | "ai" | "notifications") => {
    switch (status) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {area === "ai" ? "設定済み" : area === "notifications" ? "オン" : "接続済み"}
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
            <AlertCircle className="h-3.5 w-3.5" />
            {area === "google" ? "Google同期エラー" : area === "ai" ? "AI文章生成を再試行" : "通知エラー"}
          </span>
        );
      case "needs_reauth":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Googleを再連携してください
          </span>
        );
      case "syncing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Googleを同期しています…
          </span>
        );
      case "disconnected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            <XCircle className="h-3.5 w-3.5" />
            {area === "ai" ? "未設定・無効" : area === "notifications" ? "オフ" : "未接続"}
          </span>
        );
      case "unknown":
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            {status === "unknown" ? "確認できません" : "一時利用不可"}
          </span>
        );
      case "loading":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground animate-pulse">
            確認中…
          </span>
        );
    }
  };

  return (
    <Card className="p-5 md:p-6 space-y-4 border-primary/20 bg-background/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            接続・設定の状態
          </h2>
          <p className="text-xs text-muted-foreground">
            外部連携・AI・通知機能の現在の稼働ステータスです。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void checkHealth()}
          disabled={refreshing}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition disabled:opacity-50"
          title="ステータスを更新"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Google Calendar */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Google Calendar
            </span>
            <div className="flex items-center gap-2">
              {renderBadge(health.googleCalendar.status, "google")}
            </div>
          </div>
          <p className="text-xs font-medium text-foreground break-words">
            {health.googleCalendar.detail}
          </p>
          {health.googleCalendar.status !== "connected" && health.googleCalendar.status !== "loading" ? (
            <a href="#connections" className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline">
              Google カレンダーを設定する
            </a>
          ) : null}

        </div>

        {/* AI Integration */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI相談
            </span>
            {renderBadge(health.aiIntegration.status, "ai")}
          </div>
          <p className="text-xs font-semibold text-foreground break-words">
            利用方法: {health.aiIntegration.mode}
          </p>
          <p className="text-[11px] text-muted-foreground break-words">
            {health.aiIntegration.detail}
          </p>
          {health.aiIntegration.status !== "connected" && health.aiIntegration.status !== "loading" ? (
            <a href="#ai" className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline">
              AI相談を設定する
            </a>
          ) : null}

        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              朝晩のまとめ
            </span>
            {renderBadge(health.notifications.status, "notifications")}
          </div>
          <p className="text-xs font-medium text-foreground break-words">
            {health.notifications.detail}
          </p>
          {health.notifications.status !== "connected" && health.notifications.status !== "loading" ? (
            <a href="#notifications" className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline">
              朝晩のまとめを設定する
            </a>
          ) : null}

        </div>
      </div>
    </Card>
  );
}
