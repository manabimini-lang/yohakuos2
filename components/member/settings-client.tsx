"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { updateAiKeyAction } from "@/lib/actions/settings/update-ai-key";

import { ROLE, PLAN } from "@/lib/constants/plan";

export function SettingsClient({ 
  hasKey, 
  isPaidMember,
  stripePriceId 
}: { 
  hasKey: boolean;
  isPaidMember: boolean;
  stripePriceId?: string;
}) {
  const { update } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        update({
          role: ROLE.PAID_MEMBER,
          plan: PLAN.PREMIUM,
        });
        
        const toastShown = sessionStorage.getItem("yohaku_upgrade_toast_shown");
        if (!toastShown) {
          setShowUpgradeToast(true);
          sessionStorage.setItem("yohaku_upgrade_toast_shown", "true");
          setTimeout(() => {
            setShowUpgradeToast(false);
          }, 5000);
        }

        // Clean up URL query parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [mounted, update]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSaving(true);
    setMessage(null);
    const result = await updateAiKeyAction(apiKey);
    
    if (result.ok) {
      setMessage({ text: "接続を保存しました。", type: "success" });
      setApiKey(""); // Clear input after save
      // Force a reload to reflect the 'hasKey' state from server
      window.location.reload();
    } else {
      setMessage({ text: result.error ?? "接続できませんでした。少し時間をおいて再度お試しください。", type: "error" });
    }
    setIsSaving(false);
  };

  const handleSubscribe = async () => {
    setIsCheckoutLoading(true);
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_placeholder";
      
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("ページへの移動に失敗しました。少し時間をおいて再度お試しください。");
      }
    } catch (error) {
      alert("エラーが発生しました。");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-xl">
      {/* 振り返り空間への接続設定 */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-slate-900">自分専用の空間をつなぐ</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              YOHAKUでは、あなた自身のGemini APIを利用して、自分専用の振り返り空間を作ります。
            </p>
            <p>
              AIは答えを押し付けるためではなく、思考整理を静かに支援します。
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-slate-700">接続状態</span>
            {hasKey ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                接続済み
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                未設定
              </span>
            )}
          </div>

          <form onSubmit={handleSaveKey} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="apiKey" className="block text-xs font-medium text-slate-500">
                Gemini API キー
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-colors focus:border-slate-300 focus:bg-white focus:outline-none"
              />
            </div>

            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={isSaving || !apiKey.trim()}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "接続しています..." : (hasKey ? "キーを更新する" : "接続する")}
            </button>
          </form>
        </div>
      </section>

      {/* プラン設定 */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-slate-900">プラン</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              YOHAKU AIは、あなたの思考整理を支えるための会員向け機能です。
            </p>
            <p>
              少し疲れた日にも、安心して戻ってこられる場所を目指しています。
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">現在のステータス</span>
            <p className="text-sm font-medium text-slate-800">
              {isPaidMember ? "会員プラン利用中" : "無料プラン"}
            </p>
          </div>

          {!isPaidMember ? (
            <button
              onClick={handleSubscribe}
              disabled={isCheckoutLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {isCheckoutLoading ? "準備中..." : "会員プランを見る"}
            </button>
          ) : (
            <div className="text-sm text-slate-500">
              {/* Future: Link to Stripe customer portal */}
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Custom Toast */}
      {showUpgradeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-lg animate-in slide-in-from-bottom duration-300 flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
            <Sparkles className="h-4 w-4 stroke-[1.5] text-yellow-500 fill-yellow-500/10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-slate-800">Premiumプランへようこそ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI整理機能が利用可能になりました。
            </p>
          </div>
          <button 
            onClick={() => setShowUpgradeToast(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-auto text-xs font-semibold px-1"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
