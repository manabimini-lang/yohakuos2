"use client";

import { useState } from "react";
import { updateAiKeyAction } from "@/lib/actions/settings/update-ai-key";

export function SettingsClient({ 
  hasKey, 
  isPaidMember,
  stripePriceId 
}: { 
  hasKey: boolean;
  isPaidMember: boolean;
  stripePriceId?: string; // Replace with actual price ID for env if you want dynamic
}) {
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSaving(true);
    setMessage(null);
    const result = await updateAiKeyAction(apiKey);
    
    if (result.ok) {
      setMessage({ text: "APIキーを保存しました。", type: "success" });
      setApiKey(""); // Clear input after save
    } else {
      setMessage({ text: result.error ?? "エラーが発生しました。", type: "error" });
    }
    setIsSaving(false);
  };

  const handleSubscribe = async () => {
    setIsCheckoutLoading(true);
    try {
      // For MVP, we pass a hardcoded test price ID or env var
      // Please set NEXT_PUBLIC_STRIPE_PRICE_ID in your env
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_placeholder";
      
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("決済ページへの移動に失敗しました。");
      }
    } catch (error) {
      alert("エラーが発生しました。");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">会員プラン</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700 font-medium">
              現在のプラン: {isPaidMember ? <span className="text-emerald-600">有料会員 (PAID)</span> : <span className="text-slate-500">無料会員 (FREE)</span>}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              AI対話機能を利用するには有料会員登録が必要です。
            </p>
          </div>
          {!isPaidMember ? (
            <button
              onClick={handleSubscribe}
              disabled={isCheckoutLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isCheckoutLoading ? "準備中..." : "有料会員になる"}
            </button>
          ) : (
            <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
              契約中
            </div>
            // In a full implementation, you'd link to the Stripe Customer Portal here
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Gemini APIキー</h2>
        <p className="mb-4 text-sm text-slate-600">
          あなた自身のGemini APIキーを設定してください。キーは暗号化されて安全に保存されます。<br/>
          {hasKey && <span className="text-emerald-600 font-medium mt-1 inline-block">✓ 現在APIキーは設定されています。</span>}
        </p>

        <form onSubmit={handleSaveKey} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">APIキー</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 outline-none"
            />
          </label>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving || !apiKey.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "保存中..." : "キーを保存する"}
          </button>
        </form>
      </section>
    </div>
  );
}
