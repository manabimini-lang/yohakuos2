"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { YuiNotificationPreferences } from "@/app/ui/backend/yui/models";

export function YuiNotificationSettingsForm() {
  const [settings, setSettings] = useState<YuiNotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setError(null);
    try {
      const response = await fetch("/api/yui/notification-settings");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "通知設定の取得に失敗しました");
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通知設定の取得に失敗しました");
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/yui/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "通知設定の保存に失敗しました");
      }

      const updated = await response.json();
      setSettings(updated);
      setMessage("通知設定を保存しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "通知設定の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        通知設定を読み込んでいます...
      </Card>
    );
  }

  return (
    <Card className="space-y-6 p-6">
      <div className="space-y-2 border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          YUIが毎日の振り返りや優先事項をお知らせします。
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main enable toggle */}
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4 cursor-pointer hover:bg-muted/30 transition">
          <div className="space-y-1">
            <span className="text-sm font-semibold">YUIから通知を受け取る</span>
            <p className="text-xs text-muted-foreground">
              秘書YUIからの毎日の連絡やリマインドを有効にします。
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
          />
        </label>

        {/* Morning & Evening Notification settings */}
        <div className={`space-y-4 transition ${settings.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
          {/* Morning Brief */}
          <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.morningEnabled}
                  onChange={(e) => setSettings({ ...settings, morningEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Morning Brief（朝の連絡）</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">時間</span>
                <input
                  type="time"
                  value={settings.morningTime}
                  onChange={(e) => setSettings({ ...settings, morningTime: e.target.value })}
                  className="yohaku-input !w-auto !py-1 !px-3 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Evening Reflection */}
          <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.eveningEnabled}
                  onChange={(e) => setSettings({ ...settings, eveningEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Evening Reflection（夜の振り返り）</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">時間</span>
                <input
                  type="time"
                  value={settings.eveningTime}
                  onChange={(e) => setSettings({ ...settings, eveningTime: e.target.value })}
                  className="yohaku-input !w-auto !py-1 !px-3 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              タイムゾーン
            </label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              placeholder="Asia/Tokyo"
              className="yohaku-input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="yohaku-btn w-full md:w-auto"
        >
          {isSaving ? "保存中..." : "通知設定を保存"}
        </button>
      </form>
    </Card>
  );
}
