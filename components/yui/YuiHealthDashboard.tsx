"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Sparkles, Bell, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

type HealthStatus = "connected" | "disconnected" | "error" | "loading";

type SystemHealth = {
  googleCalendar: { status: HealthStatus; detail: string };
  aiIntegration: { status: HealthStatus; detail: string; mode: string };
  notifications: { status: HealthStatus; detail: string };
};

export function YuiHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth>({
    googleCalendar: { status: "loading", detail: "確認中..." },
    aiIntegration: { status: "loading", detail: "確認中...", mode: "取得中" },
    notifications: { status: "loading", detail: "確認中..." },
  });
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    setRefreshing(true);
    try {
      const [connRes, notifRes] = await Promise.all([
        fetch("/api/yui/connections").catch(() => null),
        fetch("/api/yui/notification-settings").catch(() => null),
      ]);

      // 1. Google Calendar Check
      let googleStatus: HealthStatus = "disconnected";
      let googleDetail = "未連携";
      if (connRes?.ok) {
        const data = await connRes.json();
        const googleConn = (data.connections ?? []).find(
          (c: any) => c.provider === "google_calendar"
        );
        if (googleConn?.status === "connected") {
          googleStatus = "connected";
          const meta = googleConn.metadata || {};
          googleDetail = meta.googleAccount ? `連携済み (${meta.googleAccount})` : "連携済み";
        } else if (googleConn?.status === "pending") {
          googleStatus = "disconnected";
          googleDetail = "接続認証待ち";
        }
      } else if (connRes && !connRes.ok) {
        googleStatus = "error";
        googleDetail = "取得エラー (401/500)";
      }

      // 2. Notifications Check
      let notifStatus: HealthStatus = "disconnected";
      let notifDetail = "無効";
      if (notifRes?.ok) {
        const notifData = await notifRes.json();
        if (notifData.enabled) {
          notifStatus = "connected";
          notifDetail = `有効 (朝 ${notifData.morningTime || "07:30"} / 夜 ${notifData.eveningTime || "21:00"})`;
        } else {
          notifDetail = "通知設定はオフです";
        }
      } else if (notifRes && !notifRes.ok) {
        notifStatus = "error";
        notifDetail = "取得エラー (401/500)";
      }

      // 3. AI Integration Check
      let aiStatus: HealthStatus = "disconnected";
      let aiDetail = "未設定";
      let aiMode = "Rule Engineのみ";

      // Test AI endpoint connection to determine active mode
      const testAiRes = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gemini" }),
      }).catch(() => null);

      if (testAiRes?.ok) {
        const testData = await testAiRes.json();
        if (testData.connected) {
          aiStatus = "connected";
          if (testData.method === "apikey") {
            aiMode = "Gemini接続中 (ユーザーKey)";
            aiDetail = "ユーザーAPI Keyで正常通信";
          } else if (testData.method === "env") {
            aiMode = "フォールバック動作中 (環境変数Key)";
            aiDetail = "システム共有API Keyで正常通信";
          } else {
            aiMode = "Gemini接続中";
            aiDetail = "正常に疎通可能";
          }
        } else {
          aiStatus = "error";
          aiMode = "APIキー未設定 / 接続失敗";
          aiDetail = testData.error || "接続テスト失敗";
        }
      } else {
        aiStatus = "disconnected";
        aiMode = "Rule Engineのみ";
        aiDetail = "AI未設定のため基本エンジンで動作";
      }

      setHealth({
        googleCalendar: { status: googleStatus, detail: googleDetail },
        aiIntegration: { status: aiStatus, detail: aiDetail, mode: aiMode },
        notifications: { status: notifStatus, detail: notifDetail },
      });
    } catch (e) {
      console.error("Health check error", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  const renderBadge = (status: HealthStatus) => {
    switch (status) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Error
          </span>
        );
      case "disconnected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            <XCircle className="h-3.5 w-3.5" />
            Disconnected
          </span>
        );
      case "loading":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground animate-pulse">
            Checking...
          </span>
        );
    }
  };

  return (
    <Card className="p-5 md:p-6 space-y-4 border-primary/20 bg-background/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            YUI Health Dashboard
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Google Calendar
            </span>
            {renderBadge(health.googleCalendar.status)}
          </div>
          <p className="text-xs font-medium text-foreground truncate">
            {health.googleCalendar.detail}
          </p>
        </div>

        {/* AI Integration */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Integration
            </span>
            {renderBadge(health.aiIntegration.status)}
          </div>
          <p className="text-xs font-semibold text-foreground truncate">
            モード: {health.aiIntegration.mode}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {health.aiIntegration.detail}
          </p>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Notifications
            </span>
            {renderBadge(health.notifications.status)}
          </div>
          <p className="text-xs font-medium text-foreground truncate">
            {health.notifications.detail}
          </p>
        </div>
      </div>
    </Card>
  );
}
