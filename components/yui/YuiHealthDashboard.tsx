"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Sparkles, Bell, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

type HealthStatus = "connected" | "disconnected" | "error" | "loading" | "needs_reauth" | "syncing" | "maintenance";

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
  const [offline, setOffline] = useState<{ google?: boolean; ai?: boolean; notif?: boolean }>({});
  const CACHE_KEY = "yui:health:cache";

  const loadCache = (): { data: any; ts: number } | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const saveCache = (data: any) => {
    try {
      const payload = { data, ts: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  };

  const minutesAgo = (ts: number | null) => {
    if (!ts) return null;
    const diff = Math.max(0, Date.now() - ts);
    return Math.round(diff / 60000);
  };

  const checkHealth = async () => {
    setRefreshing(true);
    setOffline({});
    try {
      const [healthRes, notifRes] = await Promise.all([
        fetch("/api/yui/health").catch(() => null),
        fetch("/api/yui/notification-settings").catch(() => null),
      ]);

      // default values
      let googleStatus: HealthStatus = "disconnected";
      let googleDetail = "未連携";
      let googleOffline = false;

      if (healthRes && healthRes.ok) {
        const data = await healthRes.json();
        saveCache(data);
        const googleHealth = data.google;
        if (googleHealth?.status === "connected") {
          googleStatus = "connected";
          googleDetail = googleHealth.lastSyncAt ? `Connected / 同期 ${new Date(googleHealth.lastSyncAt).toLocaleString("ja-JP")}` : "Connected";
        } else if (googleHealth?.status === "syncing") {
          googleStatus = "syncing";
          googleDetail = "Google Syncing...";
        } else if (googleHealth?.status === "needs_reauth") {
          googleStatus = "needs_reauth";
          googleDetail = googleHealth.lastError || "再接続してください";
        } else if (googleHealth?.status === "maintenance") {
          googleStatus = "maintenance";
          googleDetail = googleHealth.lastError || "サービス停止中";
        } else if (googleHealth?.status === "error") {
          googleStatus = "error";
          googleDetail = googleHealth.lastError || "同期エラー";
        }
      } else {
        // health API failed — try cache
        const cache = typeof window !== "undefined" ? loadCache() : null;
        if (cache?.data?.google) {
          const cached = cache.data.google;
          googleStatus = cached.status === "connected" ? "connected" : "maintenance";
          const mins = minutesAgo(cache.ts);
          googleDetail = `${cached.lastSyncAt ? `同期 ${new Date(cached.lastSyncAt).toLocaleString("ja-JP")} / ` : ""}最終更新: ${mins ?? "?"}分前`;
          googleOffline = true;
        } else {
          // no cache available — show maintenance
          googleStatus = "maintenance";
          googleDetail = "サービス利用不可";
          googleOffline = true;
        }
      }

      // Notifications
      let notifStatus: HealthStatus = "disconnected";
      let notifDetail = "無効";
      let notifOffline = false;
      if (notifRes && notifRes.ok) {
        const notifData = await notifRes.json();
        notifStatus = notifData.enabled ? "connected" : "disconnected";
        notifDetail = notifData.enabled
          ? `有効 (朝 ${notifData.morningTime || "07:30"} / 夜 ${notifData.eveningTime || "21:00"})`
          : "通知設定はオフです";
      } else {
        const cache = typeof window !== "undefined" ? loadCache() : null;
        if (cache?.data?.notifications) {
          const mins = minutesAgo(cache.ts);
          notifStatus = cache.data.notifications.enabled ? "connected" : "disconnected";
          notifDetail = `最終更新: ${mins ?? "?"}分前`;
          notifOffline = true;
        } else {
          notifStatus = "maintenance";
          notifDetail = "通知サービス利用不可";
          notifOffline = true;
        }
      }

      // AI Integration
      let aiStatus: HealthStatus = "disconnected";
      let aiDetail = "未設定";
      let aiMode = "Rule Engineのみ";
      let aiOffline = false;

      const testAiRes = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gemini" }),
      }).catch(() => null);

      if (testAiRes && testAiRes.ok) {
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
        const cache = typeof window !== "undefined" ? loadCache() : null;
        if (cache?.data?.aiIntegration) {
          aiStatus = cache.data.aiIntegration.status === "connected" ? "connected" : "disconnected";
          aiMode = cache.data.aiIntegration.mode || aiMode;
          aiDetail = `最終更新: ${minutesAgo(cache.ts) ?? "?"}分前`;
          aiOffline = true;
        } else {
          aiStatus = "disconnected";
          aiMode = "Rule Engineのみ";
          aiDetail = "AI未設定のため基本エンジンで動作";
          aiOffline = true;
        }
      }

      setOffline({ google: googleOffline, ai: aiOffline, notif: notifOffline });

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

  const renderBadge = (status: HealthStatus, area: "google" | "ai" | "notifications") => {
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
            {area === "google" ? "Google Sync Error" : area === "ai" ? "AI Connection Error" : "Notification Error"}
          </span>
        );
      case "needs_reauth":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Google Needs Re-auth
          </span>
        );
      case "syncing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Google Syncing...
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
            <div className="flex items-center gap-2">
              {renderBadge(health.googleCalendar.status, "google")}
            </div>
          </div>
          <p className="text-xs font-medium text-foreground truncate">
            {health.googleCalendar.detail}
          </p>
          {offline.google && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">Offline</span>
            </div>
          )}
        </div>

        {/* AI Integration */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Integration
            </span>
            {renderBadge(health.aiIntegration.status, "ai")}
          </div>
          <p className="text-xs font-semibold text-foreground truncate">
            モード: {health.aiIntegration.mode}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {health.aiIntegration.detail}
          </p>
          {offline.ai && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">Offline</span>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Notifications
            </span>
            {renderBadge(health.notifications.status, "notifications")}
          </div>
          <p className="text-xs font-medium text-foreground truncate">
            {health.notifications.detail}
          </p>
          {offline.notif && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">Offline</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
