"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Key, Cpu, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
// Server Action import removed; using API route instead

type AiSettingsClientProps = {
  initialSettings: {
    provider: string;
    hasKey: boolean;
    model: string;
    isEnabled: boolean;
  } | null;
  aiAvailable?: boolean;
  aiSource?: string | null;
};

export function AiSettingsClient({ initialSettings, aiAvailable, aiSource }: AiSettingsClientProps) {
  const [provider, setProvider] = useState(initialSettings?.provider || "gemini");
  const [apiKey, setApiKey] = useState(initialSettings?.hasKey ? "••••••••" : "");
  const [isEnabled, setIsEnabled] = useState(initialSettings?.isEnabled || false);

  const FIXED_MODEL = "gemini-2.5-flash";
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
          apiKey: apiKey === "••••••••" ? "" : apiKey, // If it's the placeholder, let API use existing key from DB (by omitting/sending blank)
        }),
      });

      const data = await response.json();
      if (response.ok && data.connected) {
        setStatusMsg({
          type: "success",
          text: `接続に成功しました。${data.message || "静かに接続されました。"}`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || "接続テストに失敗しました。キーを確認してください。",
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
          model: FIXED_MODEL,
          isEnabled,
        }),
      });
      const res = await response.json();
      if (response.ok && res?.success) {
        setStatusMsg({
          type: "success",
          text: isEnabled ? "AI設定を保存し、静かに接続されました。" : "AI設定を保存し、機能を停止しました。",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res?.error?.message ?? "設定の保存に失敗しました。",
        });
      }
    } catch (error: any) {
      setStatusMsg({
        type: "error",
        text: error.message ?? "設定の保存中にエラーが発生しました。",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-10 selection:bg-slate-100 w-full">
      {/* Back to Profile */}
      <div>
        <Link 
          href="/settings" 
          className="inline-flex items-center text-xs text-muted-foreground hover:text-slate-650 transition-colors font-mono"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Settings
        </Link>
      </div>

      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif text-foreground tracking-wide">
          AI接続設定
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {aiAvailable 
            ? `接続済み (${
                aiSource === "gemini_oauth" ? "Gemini OAuth連携" :
                aiSource === "legacy_api_key" ? "Legacy API Key設定" :
                aiSource === "user_ai_settings" ? "APIキー設定有効" :
                aiSource === "starter" ? "Starter Journey利用中" : "接続中"
              })` 
            : "AIを接続すると、余白に意味がゆっくり積もり始めます。"}
        </p>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div className={`flex items-start space-x-3 rounded-2xl border p-4 animate-in fade-in duration-300 ${
          statusMsg.type === "success" 
            ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" 
            : "bg-rose-50/50 border-rose-100 text-rose-700"
        }`}>
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{statusMsg.type === "success" ? "完了" : "注意"}</p>
            <p className="text-[11px] leading-relaxed opacity-90">{statusMsg.text}</p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-150 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        {/* Header Indicator */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
          <div className="p-2 bg-slate-50 rounded-xl text-muted-foreground">
            <Sparkles className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">API接続</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">あなた個人のAIリソースを接続します</p>
          </div>
        </div>

        {/* Enable / Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100/80">
          <div className="space-y-0.5">
            <label htmlFor="ai-enable-toggle" className="text-xs font-semibold text-slate-700">AIによる自動解析</label>
            <p className="text-[10px] text-muted-foreground">有効にすると、保存した内容を自動で要約・タグ付けします</p>
          </div>
          <button
            type="button"
            id="ai-enable-toggle"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isEnabled ? "bg-slate-900" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Provider Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">プロバイダー</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-foreground focus:outline-none focus:border-slate-400 transition-colors"
            >
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 block">APIキー</label>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] text-muted-foreground hover:text-slate-600 transition-colors underline"
              >
                キーの取得方法
              </a>
            </div>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-slate-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">利用モデル</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              gemini-2.5-flash（固定）
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-50 flex items-center space-x-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving || (!apiKey && !initialSettings?.hasKey)}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-600 font-medium px-4 py-2.5 transition-colors text-xs disabled:opacity-50 disabled:pointer-events-none"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>テスト中...</span>
              </>
            ) : (
              <span>接続テスト</span>
            )}
          </button>

          <button
            type="submit"
            disabled={saving || testing}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-foreground font-medium px-4 py-2.5 transition-colors text-xs disabled:opacity-50 disabled:pointer-events-none shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <span>設定を保存</span>
            )}
          </button>
        </div>
      </form>

      {/* Limits & Security Note */}
      <div className="flex items-start space-x-2.5 max-w-sm mx-auto text-[10px] text-slate-450 leading-relaxed">
        <AlertCircle className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            APIキーは高度な暗号化（AES-256-GCM）を施した上で、安全にデータベースに保存されます。
          </p>
          <p>
            自動制限機能により、1日あたり100,000トークン、月間2,000,000トークンを超える処理は自動的に一時停止し、予期せぬ料金の発生を防ぎます。
          </p>
        </div>
      </div>
    </div>
  );
}
