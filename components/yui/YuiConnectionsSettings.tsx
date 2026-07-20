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
    description: "予定と空き時間の読み取り準備を行います。",
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

  const loadConnections = async () => {
    setError(null);
    try {
      const response = await fetch("/api/yui/connections");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "接続設定の取得に失敗しました");
      }

      const payload = await response.json();
      const nextConnections = (payload.connections ?? []).reduce((acc: ConnectionsByProvider, connection: YuiConnection) => {
        acc[connection.provider] = connection;
        return acc;
      }, {});
      setConnections(nextConnections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "接続設定の取得に失敗しました");
    }
  };

  useEffect(() => {
    void loadConnections();
  }, []);

  const handleToggle = async (provider: ConnectionProvider) => {
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

          return (
            <Card key={provider.provider} className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{provider.label}</h3>
                  <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs">
                    {isConnected ? "接続済み" : isPending ? "接続待ち" : "未接続"}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{provider.description}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                <p className="font-medium">許可する情報</p>
                <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                  {JSON.stringify(provider.permissions, null, 2)}
                </pre>
              </div>

              {connection?.connected_at && (
                <p className="text-xs text-muted-foreground">
                  connected_at: {new Date(connection.connected_at).toLocaleString()}
                </p>
              )}

              <button
                type="button"
                disabled={loadingProvider === provider.provider}
                onClick={() => void handleToggle(provider)}
                className="yohaku-btn"
              >
                {loadingProvider === provider.provider
                  ? "更新中..."
                  : isConnected
                    ? "切断する"
                    : isPending
                      ? "接続を完了"
                      : "接続する"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
