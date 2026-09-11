"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Key, Cpu, CheckCircle2, AlertCircle, Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
// Server Action import removed; using API route instead

type YuiAiSettingsCardProps = {
  isPremium: boolean;
  initialSettings?: {
    provider: string;
    hasKey: boolean;
    availableKeys?: { gemini: boolean; groq: boolean };
    model: string;
    isEnabled: boolean;
  } | null;
};

export function YuiAiSettingsCard({ initialSettings, isPremium }: YuiAiSettingsCardProps) {
  const [provider, setProvider] = useState(initialSettings?.provider || (isPremium ? "managed" : "gemini"));
  const [apiKey, setApiKey] = useState(initialSettings?.hasKey ? "••••••••" : "");
  const [hasSavedKey, setHasSavedKey] = useState(initialSettings?.hasKey ?? false);
  const [availableKeys, setAvailableKeys] = useState(initialSettings?.availableKeys ?? { gemini: false, groq: false });
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isRevealingKey, setIsRevealingKey] = useState(false);
  const [isEnabled, setIsEnabled] = useState(isPremium || (initialSettings?.isEnabled ?? false));

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggleApiKeyVisibility = async () => {
    if (isApiKeyVisible) {
      setIsApiKeyVisible(false);
      if (hasSavedKey) setApiKey("••••••••");
      return;
    }

    if (!hasSavedKey || apiKey !== "••••••••") {
      setIsApiKeyVisible(true);
      return;
    }

    setIsRevealingKey(true);
    setStatusMsg(null);
    try {
      const response = await fetch(`/api/ai/settings?reveal=true&provider=${provider}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.apiKey) {
        throw new Error(data?.error ?? "保存済みAPIキーを表示できませんでした。");
      }
      setApiKey(data.apiKey);
      setIsApiKeyVisible(true);
    } catch (error) {
      setStatusMsg({
        type: "error",
        text: error instanceof Error ? error.message : "保存済みAPIキーを表示できませんでした。",
      });
    } finally {
      setIsRevealingKey(false);
    }
  };

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
        if (provider === "gemini" || provider === "groq") {
          setAvailableKeys((current) => ({ ...current, [provider]: true }));
          setHasSavedKey(true);
          setApiKey("••••••••");
          setIsApiKeyVisible(false);
        }
        setStatusMsg({
          type: "success",
          text: "AI接続設定を保存しました。",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: typeof res?.error === "string" ? res.error : res?.error?.message ?? "保存に失敗しました。",
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
          <h2 className="text-lg font-semibold tracking-tight text-foreground">AI相談の設定</h2>
          <p className="text-xs text-muted-foreground">
            {isPremium ? "YOHAKUのAIと、ご自身のGemini・Groqを切り替えられます。" : "ご自身のGeminiまたはGroq APIキーを設定します。"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            AIサービス
          </label>
          <select
            value={provider}
            onChange={(e) => {
              const nextProvider = e.target.value;
              const nextHasKey = nextProvider === "gemini" || nextProvider === "groq"
                ? availableKeys[nextProvider]
                : false;
              setProvider(nextProvider);
              setApiKey(nextHasKey ? "••••••••" : "");
              setHasSavedKey(nextHasKey);
              setIsApiKeyVisible(false);
            }}
            className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {isPremium ? <option value="managed">YOHAKUのAI（料金込み・推奨）</option> : null}
            <option value="gemini">Google Gemini (推奨)</option>
            <option value="groq">Groq（高速な文章生成）</option>
          </select>
          {(availableKeys.gemini || availableKeys.groq) ? (
            <p className="text-xs text-muted-foreground">
              保存済み：{[availableKeys.gemini ? "Gemini" : "", availableKeys.groq ? "Groq" : ""].filter(Boolean).join("・")}
            </p>
          ) : null}
        </div>

        {provider === "managed" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
            APIキーは不要です。AI利用料はPremium料金に含まれ、用途に応じてGemini 2.5 FlashとFlash-Liteを自動で使い分けます。
          </div>
        ) : <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" />
            {provider === "groq" ? "Groq APIキー" : "Gemini APIキー"}
          </label>
          <div className="relative">
            <input
              type={isApiKeyVisible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (e.target.value !== "••••••••") setHasSavedKey(false);
              }}
              placeholder={provider === "groq" ? "gsk_..." : "AIza... または AQ..."}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-input bg-background px-3 py-2 pr-12 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => void handleToggleApiKeyVisibility()}
              disabled={isRevealingKey || !apiKey}
              aria-label={isApiKeyVisible ? "APIキーを隠す" : "APIキーを表示する"}
              aria-pressed={isApiKeyVisible}
              className="absolute inset-y-0 right-1 inline-flex w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted/50 hover:text-foreground disabled:opacity-40"
            >
              {isRevealingKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isApiKeyVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Groqでは文章生成を利用できます。記憶の類似検索に必要な埋め込み生成はGemini接続時のみ利用できます。保存済みのキーは右端の目のボタンを押した時だけ表示します。
          </p>
        </div>}

        {provider !== "managed" ? <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="yui-ai-enabled"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <label htmlFor="yui-ai-enabled" className="text-sm font-medium text-foreground cursor-pointer">
            YUIの文章作成にAIを使う
          </label>
        </div> : null}

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
            {testing ? "接続確認中..." : provider === "managed" ? "YOHAKUのAI接続をテスト" : "接続テスト"}
          </button>
        </div>
      </form>
    </Card>
  );
}
