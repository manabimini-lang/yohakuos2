"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, KeyRound } from "lucide-react";
import { updateAiKeyAction } from "@/lib/actions/settings/update-ai-key";

import { ROLE, PLAN } from "@/lib/constants/plan";

export function SettingsClient({ 
  hasKey: initialHasKey, 
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
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);
  const [showConnectToast, setShowConnectToast] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // State for AI connection
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    method: "oauth" | "apikey" | null;
    expiresSoon?: boolean;
  }>({ connected: initialHasKey, method: initialHasKey ? "apikey" : null });

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/gemini/status");
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch AI connection status", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStatus();
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

      if (params.get("gemini") === "connected") {
        setShowConnectToast(true);
        setTimeout(() => setShowConnectToast(false), 5000);
        
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        fetchStatus();
      }

      if (params.get("gemini") === "error") {
        setMessage({ text: "Googleアカウントの連携に失敗しました。もう一度お試しください。", type: "error" });
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
      setMessage({ text: "APIキーを保存しました。", type: "success" });
      setApiKey(""); // Clear input after save
      fetchStatus();
    } else {
      setMessage({ text: result.error ?? "接続できませんでした。少し時間をおいて再度お試しください。", type: "error" });
    }
    setIsSaving(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("AI整理機能の接続を解除しますか？")) return;
    
    try {
      const res = await fetch("/api/gemini/disconnect", { method: "POST" });
      if (res.ok) {
        setConnectionStatus({ connected: false, method: null });
        setMessage({ text: "接続を解除しました。", type: "success" });
      }
    } catch (e) {
      setMessage({ text: "解除に失敗しました。", type: "error" });
    }
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

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("カスタマーポータルへの移動に失敗しました。");
      }
    } catch (error) {
      alert("エラーが発生しました。");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-12 max-w-xl">
      {/* 振り返り空間への接続設定 (AI Connection) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-slate-900">AI接続</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>静かな振り返りを、AIとともに。</p>
            <p>Googleアカウントを連携することで、あなた専用のAI整理機能が利用可能になります。</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-slate-700">接続状態</span>
            {connectionStatus.connected ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                接続済み ({connectionStatus.method === "oauth" ? "Google連携" : "APIキー"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                未接続
              </span>
            )}
          </div>

          {!connectionStatus.connected ? (
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = "/api/gemini/connect"}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Googleアカウントで接続する
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleDisconnect}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
              >
                接続を解除する
              </button>
            </div>
          )}

          {message && (
            <p className={`mt-4 text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {message.text}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              APIキーを利用する（上級者向け）
            </button>
            
            {showAdvanced && (
              <form onSubmit={handleSaveKey} className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Google連携ではなく、独自のGemini APIキーを使用して接続します。
                    OAuth連携を行っている場合は、APIキーが優先されます。
                  </p>
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

                <button
                  type="submit"
                  disabled={isSaving || !apiKey.trim()}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  {isSaving ? "保存中..." : "APIキーを保存する"}
                </button>
              </form>
            )}
          </div>
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
              <button
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isPortalLoading ? "準備中..." : "支払い設定・解約"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Connect Success Toast */}
      {showConnectToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-lg animate-in slide-in-from-bottom duration-300 flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/50 border border-emerald-200 text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-emerald-900">Googleアカウントを接続しました</h3>
            <p className="text-xs text-emerald-700/80 leading-relaxed">
              AI整理機能が利用可能になりました。
            </p>
          </div>
          <button 
            onClick={() => setShowConnectToast(false)}
            className="text-emerald-500 hover:text-emerald-700 transition-colors ml-auto text-xs font-semibold px-1"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Upgrade Premium Toast */}
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
