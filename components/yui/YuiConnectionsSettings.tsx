"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type ConnectionProvider = {
  provider: string;
  label: string;
  description: string;
  permissions: Record<string, unknown>;
};

const CONNECTION_PROVIDERS: ConnectionProvider[] = [
  {
    provider: "google_calendar",
    label: "Google Calendar",
    description: "予定と空き時間の読み取り（Read Only）を行います。",
    permissions: { calendar_read: true, calendar_write: false },
  },
  {
    provider: "gmail",
    label: "Gmail",
    description: "メールの読み取り準備を行います。",
    permissions: { email_read: true, email_send: false },
  },
  {
    provider: "google_drive",
    label: "Google Drive",
    description: "ファイル参照の準備を行います。",
    permissions: { drive_read: true },
  },
  {
    provider: "apple_health",
    label: "Apple Health",
    description: "ヘルスデータ参照の準備を行います。",
    permissions: { health_read: true },
  },
  {
    provider: "photos",
    label: "Photos",
    description: "写真メタ情報参照の準備を行います。",
    permissions: { photos_read: true },
  },
  {
    provider: "notion",
    label: "Notion",
    description: "ノート参照の準備を行います。",
    permissions: { notion_read: true },
  },
  {
    provider: "discord",
    label: "Discord",
    description: "通知やメッセージ参照の準備を行います。",
    permissions: { messages_read: true },
  },
  {
    provider: "obsidian",
    label: "Obsidian",
    description: "ローカルノート参照の準備を行います。",
    permissions: { notes_read: true },
  },
];

type ConnectionHealthPayload = {
  google: {
    status: "connected" | "refreshing" | "needs_reauth" | "sync_error" | "disconnected";
    calendarConnected: boolean;
    gmailConnected: boolean;
    scopes: string[];
    tokenValid: boolean;
    lastSyncAt: string | null;
    lastError: string | null;
  };
};

export function YuiConnectionsSettings() {
  const [health, setHealth] = useState<ConnectionHealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadConnections = async () => {
    setError(null);
    try {
      const response = await fetch("/api/yui/health");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "接続設定の取得に失敗しました");
      }

      const payload = await response.json();
      setHealth(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "接続設定の取得に失敗しました");
    }
  };

  useEffect(() => {
    void loadConnections();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/google/sync", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "同期に失敗しました");
      }
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "同期に失敗しました");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggle = async (provider: ConnectionProvider) => {
    if (provider.provider === "google_calendar") {
      // Redirect to Google Connect OAuth Route
      window.location.href = "/api/yui/google/connect";
      return;
    }

    setLoadingProvider(provider.provider);
    setError(null);

    try {
      const response = await fetch("/api/yui/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.provider,
          status: "pending",
          permissions: provider.permissions,
          metadata: {
            display_name: provider.label,
            note: "OAuth未接続の基盤レコード",
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "接続候補の作成に失敗しました");
      }

      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "接続状態の更新に失敗しました");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {CONNECTION_PROVIDERS.map((provider) => {
          const isGoogleCalendar = provider.provider === "google_calendar";
          const googleStatus = health?.google?.status ?? "disconnected";
          const isConnected = googleStatus === "connected";
          const isPending = googleStatus === "refreshing";
          const lastSyncAt = health?.google?.lastSyncAt ? new Date(health.google.lastSyncAt).toLocaleString("ja-JP") : "未同期";
          const healthMessage = health?.google?.lastError ?? "";
          const healthBadgeLabel = googleStatus === "connected"
            ? "✓ Connected"
            : googleStatus === "refreshing"
              ? "Google Syncing..."
              : googleStatus === "needs_reauth"
                ? "⚠ 再連携してください"
                : googleStatus === "sync_error"
                  ? "⚠ Google Sync Error"
                  : "未接続";
          const healthBadgeClass = googleStatus === "connected"
            ? "bg-emerald-100 text-emerald-800"
            : googleStatus === "refreshing"
              ? "bg-sky-100 text-sky-800"
              : googleStatus === "needs_reauth"
                ? "bg-amber-100 text-amber-800"
                : googleStatus === "sync_error"
                  ? "bg-rose-100 text-rose-800"
                  : "border border-border bg-muted/20 text-muted-foreground";

          return (
            <Card key={provider.provider} className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{provider.label}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${healthBadgeClass}`}>
                   {healthBadgeLabel}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{provider.description}</p>
              </div>

              {isGoogleCalendar && (
                <div className="rounded-2xl border border-border bg-background p-4 space-y-2 text-xs">
                  {healthMessage && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                      {healthMessage}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最終同期:</span>
                    <span>{lastSyncAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calendar:</span>
                    <span>{health?.google?.calendarConnected ? "✓" : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gmail:</span>
                    <span>{health?.google?.gmailConnected ? "✓" : "—"}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={loadingProvider === provider.provider}
                  onClick={() => void handleToggle(provider)}
                  className="yohaku-btn"
                >
                  {loadingProvider === provider.provider
                    ? "更新中..."
                    : isGoogleCalendar
                      ? isConnected || googleStatus === "needs_reauth" || googleStatus === "sync_error"
                        ? "Googleアカウントを再連携"
                        : "Google Calendarと連携"
                      : isConnected
                        ? "切断する"
                        : isPending
                          ? "接続を完了"
                          : "接続する"}
                </button>

                {isGoogleCalendar && isConnected && (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => void handleManualSync()}
                    className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted/30 transition disabled:opacity-50"
                  >
                    {isSyncing ? "同期中..." : "今すぐ同期"}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
