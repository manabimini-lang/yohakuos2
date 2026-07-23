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

type ConnectionsByProvider = Record<string, YuiConnection>;

export function YuiConnectionsSettings() {
  const [connections, setConnections] = useState<ConnectionsByProvider>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadConnections = async () => {
    setError(null);
    try {
      const response = await fetch("/api/yui/connections");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "接続設定の取得に失敗しました");
      }

      const payload = await response.json();
      const nextConnections = (payload.connections ?? []).reduce(
        (acc: ConnectionsByProvider, connection: YuiConnection) => {
          acc[connection.provider] = connection;
          return acc;
        },
        {},
      );
      setConnections(nextConnections);
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
      const existing = connections[provider.provider] ?? null;

      if (!existing) {
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
      } else {
        const nextStatus = existing.status === "connected" ? "disconnected" : "connected";
        const response = await fetch(`/api/yui/connections/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "接続状態の更新に失敗しました");
        }
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
          const connection = connections[provider.provider] ?? null;
          const status = connection?.status ?? "disconnected";
          const isPending = status === "pending";
          const isConnected = status === "connected";
          const isGoogleCalendar = provider.provider === "google_calendar";

          const meta = (connection?.metadata as Record<string, unknown>) || {};
          const googleAccount = typeof meta.googleAccount === "string" ? meta.googleAccount : "";
          const lastSyncAt = typeof meta.lastSyncAt === "string" ? meta.lastSyncAt : "";

          return (
            <Card key={provider.provider} className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{provider.label}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isConnected
                        ? "bg-emerald-100 text-emerald-800"
                        : isPending
                          ? "bg-amber-100 text-amber-800"
                          : "border border-border bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    {isConnected ? "接続済み" : isPending ? "接続待ち" : "未接続"}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{provider.description}</p>
              </div>

              {isGoogleCalendar && isConnected && (
                <div className="rounded-2xl border border-border bg-background p-4 space-y-2 text-xs">
                  {googleAccount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">アカウント:</span>
                      <span className="font-semibold text-foreground">{googleAccount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最終同期日時:</span>
                    <span>
                      {lastSyncAt ? new Date(lastSyncAt).toLocaleString("ja-JP") : "未同期"}
                    </span>
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
                      ? isConnected
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
