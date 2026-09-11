"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { YuiConnection } from "@/app/ui/backend/yui/models";

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
    description: "予定と空き時間を読み取り、YUIから予定を登録します。",
    permissions: { calendar_read: true, calendar_write: true },
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
    description: "ファイル参照は未対応です。対応時にここから連携できます。",
    permissions: { drive_read: true },
  },
  {
    provider: "apple_health",
    label: "Apple Health",
    description: "ヘルスデータ参照は未対応です。対応時にここから連携できます。",
    permissions: { health_read: true },
  },
  {
    provider: "photos",
    label: "Photos",
    description: "写真メタ情報参照は未対応です。対応時にここから連携できます。",
    permissions: { photos_read: true },
  },
  {
    provider: "notion",
    label: "Notion",
    description: "ノート参照は未対応です。対応時にここから連携できます。",
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
    description: "ローカルノート参照は未対応です。対応時にここから連携できます。",
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
  const [connections, setConnections] = useState<YuiConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadConnections = async () => {
    setError(null);
    try {
      const [healthResponse, connectionsResponse] = await Promise.all([
        fetch("/api/yui/health"),
        fetch("/api/yui/connections"),
      ]);
      if (!healthResponse.ok || !connectionsResponse.ok) {
        const payload = await (healthResponse.ok ? connectionsResponse : healthResponse).json().catch(() => null);
        throw new Error(payload?.error ?? "接続設定の取得に失敗しました");
      }

      const [healthPayload, connectionsPayload] = await Promise.all([
        healthResponse.json(),
        connectionsResponse.json(),
      ]);
      setHealth(healthPayload);
      setConnections(connectionsPayload.connections ?? []);
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
      const responses = await Promise.all([
        fetch("/api/yui/google/sync", { method: "POST" }),
        ...(health?.google.gmailConnected
          ? [fetch("/api/yui/gmail/sync", { method: "POST" })]
          : []),
      ]);
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const payload = await failed.json().catch(() => null);
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
    if (provider.provider === "google_calendar" || provider.provider === "gmail") {
      // Redirect to Google Connect OAuth Route
      window.location.href = "/api/yui/google/connect";
      return;
    }
    if (provider.provider === "discord") {
      window.location.href = "/api/auth/discord/connect?return_to=/yui/settings";
      return;
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
          const isGoogleProvider = provider.provider === "google_calendar" || provider.provider === "gmail";
          const isImplemented = isGoogleProvider || provider.provider === "discord";
          const googleStatus = health?.google?.status ?? "disconnected";
          const providerConnection = connections.find((connection) => connection.provider === provider.provider);
          const isConnected = provider.provider === "gmail"
            ? Boolean(health?.google?.gmailConnected)
            : isGoogleCalendar
            ? googleStatus === "connected"
            : providerConnection?.status === "connected";
          const lastSyncAt = health?.google?.lastSyncAt ? new Date(health.google.lastSyncAt).toLocaleString("ja-JP") : "未同期";
          const lastSyncAgeMs = health?.google?.lastSyncAt ? Date.now() - new Date(health.google.lastSyncAt).getTime() : null;
          const isGoogleSyncStale = isGoogleProvider
            && (lastSyncAgeMs === null || !Number.isFinite(lastSyncAgeMs) || lastSyncAgeMs > 24 * 60 * 60 * 1000);
          const healthMessage = health?.google?.lastError ?? "";
          const healthBadgeLabel = googleStatus === "connected"
            ? isGoogleSyncStale
              ? "⚠ 同期を確認"
              : "✓ 接続済み"
            : googleStatus === "refreshing"
              ? "Googleを同期しています…"
              : googleStatus === "needs_reauth"
                ? "⚠ 再連携してください"
                : googleStatus === "sync_error"
                  ? "⚠ Googleの同期エラー"
                  : "未接続";
          const healthBadgeClass = googleStatus === "connected"
            ? isGoogleSyncStale
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
            : googleStatus === "refreshing"
              ? "bg-sky-100 text-sky-800"
              : googleStatus === "needs_reauth"
                ? "bg-amber-100 text-amber-800"
                : googleStatus === "sync_error"
                  ? "bg-rose-100 text-rose-800"
              : "border border-border bg-muted/20 text-muted-foreground";
          const providerHealthBadgeLabel = provider.provider === "gmail" && !isConnected && googleStatus === "connected"
            ? "Gmail権限が必要"
            : isConnected
              ? "✓ 接続済み"
              : healthBadgeLabel;
          const providerHealthBadgeClass = provider.provider === "gmail" && !isConnected && googleStatus === "connected"
            ? "bg-amber-100 text-amber-800"
            : healthBadgeClass;

          return (
            <Card key={provider.provider} className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{provider.label}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${isGoogleProvider ? providerHealthBadgeClass : isConnected ? "bg-emerald-100 text-emerald-800" : "border border-border bg-muted/20 text-muted-foreground"}`}>
                   {isGoogleProvider ? providerHealthBadgeLabel : isConnected ? "✓ 接続済み" : isImplemented ? "未接続" : "未対応"}
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
                  {isGoogleSyncStale && googleStatus === "connected" && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 leading-5 text-amber-900">
                      最終同期から24時間以上経過しています。自動同期を再試行しますが、すぐに反映したい場合は「今すぐ同期」を実行してください。
                    </p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">予定:</span>
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
                  disabled={!isImplemented}
                  onClick={() => void handleToggle(provider)}
                  className="yohaku-btn disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGoogleProvider
                      ? isConnected || googleStatus === "needs_reauth" || googleStatus === "sync_error"
                        ? "Googleアカウントを再連携"
                        : `Googleで${provider.label}を連携`
                    : provider.provider === "discord"
                      ? isConnected
                        ? "接続済み"
                        : "Discordと連携"
                    : "現在は未対応"}
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
