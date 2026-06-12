"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";

import { ROLE, PLAN } from "@/lib/constants/plan";

export function SettingsClient({ 
  isPaidMember,
  stripePriceId 
}: { 
  isPaidMember: boolean;
  stripePriceId?: string;
}) {
  const { update } = useSession();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
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
      {message && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message.text}
        </div>
      )}

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
