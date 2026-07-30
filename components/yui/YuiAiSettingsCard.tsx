"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Key, Cpu, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
// Server Action import removed; using API route instead

type YuiAiSettingsCardProps = {
  initialSettings?: {
    provider: string;
    hasKey: boolean;
    model: string;
    isEnabled: boolean;
  } | null;
};

export function YuiAiSettingsCard({ initialSettings }: YuiAiSettingsCardProps) {
  const [provider, setProvider] = useState(initialSettings?.provider || "gemini");
  const [apiKey, setApiKey] = useState(initialSettings?.hasKey ? "••••••••" : "");
  const [isEnabled, setIsEnabled] = useState(initialSettings?.isEnabled ?? false);

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const response = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey === "••••••••" ? "" : apiKey,
        }),
      });

      const data = await response.json();
      if (response.ok && data.connected) {
        setStatusMsg({
          type: "success",
          text: `接続に成功しました。${data.message || "正常に動作しています。"}`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || "接続テストに失敗しました。APIキーを確認してください。",
        });
      }
    } catch (error) {
      setStatusMsg({
        type: "error",
        text: "接続テスト中にエラーが発生しました。",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const response = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey === "••••••••" ? "" : apiKey,
          isEnabled,
        }),
      });
      const res = await response.json();

      if (response.ok && res?.success) {
        setStatusMsg({
          type: "success",
          text: "AI接続設定を保存しました。",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res?.error?.message ?? "保存に失敗しました。",
        });
      }
    } catch (error: any) {
      setStatusMsg({
        type: "error",
        text: error.message ?? "保存処理中にエラーが発生しました。",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 md:p-8 space-y-6 border-primary/20 bg-background/90 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">AI Integration (LLM)</h2>
          <p className="text-xs text-muted-foreground">
            API Keyを設定すると、YUIが作成した朝礼や提案を自然な秘書口調に整えます。未設定時はルールエンジンで動作します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="gemini">Google Gemini (推奨)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" />
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza... または AQ..."
            className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="yui-ai-enabled"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <label htmlFor="yui-ai-enabled" className="text-sm font-medium text-foreground cursor-pointer">
            YUIの文章補セスでAI(LLM)を使用する
          </label>
        </div>

        {statusMsg && (
          <div
            className={`flex items-center gap-2 rounded-2xl p-3 text-xs md:text-sm ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="yohaku-btn inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold shadow-sm"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            設定を保存
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition"
          >
            {testing ? "接続確認中..." : "接続テスト"}
          </button>
        </div>
      </form>
    </Card>
  );
}
