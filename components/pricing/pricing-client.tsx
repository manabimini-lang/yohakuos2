"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, ArrowRight } from "lucide-react";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { Turnstile } from "@marsidev/react-turnstile";
import { createStripeCheckoutSession } from "@/app/actions/stripe-checkout";

export function PricingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const isPremium = !!session?.user && hasPremiumAccess(
    (session.user as any).plan,
    (session.user as any).role
  );

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleSubscribe = async () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/pricing")}`);
      return;
    }

    if (isPremium) return;

    if (!turnstileToken && turnstileSiteKey) {
      alert("アクセスを確認できませんでした。しばらくしてからお試しください。");
      return;
    }

    setLoading(true);
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
      if (!priceId) {
        alert("Stripe Price IDが設定されていません。管理者にお問い合わせください。");
        return;
      }

      const res = await createStripeCheckoutSession({ 
        priceId, 
        turnstileToken: turnstileToken || "test-token" // allow dev bypass if no sitekey
      });

      if (!res.success || !res.url) {
        alert(res.error || "通信中にエラーが発生しました。");
        return;
      }

      window.location.href = res.url;
    } catch (error) {
      console.error(error);
      alert("通信中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:py-28 space-y-16 selection:bg-slate-100">
      {/* Header section */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider text-muted-foreground bg-slate-50 border border-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground stroke-[1.5]" />
          <span>QUIET MEMBERSHIP</span>
        </div>
        <h1 className="text-3xl font-serif text-slate-850 tracking-wide mt-2">YOHAKU Premium</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          AI整理や深い振り返りを利用できます。これは単なる機能の解放ではなく、深く自分と向き合うための参加権です。
        </p>
      </div>

      {/* Plan Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-sm space-y-8 max-w-md mx-auto relative overflow-hidden">
        {/* Subtle accent border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-900/10"></div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Premium プラン</h2>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-serif font-medium text-foreground">¥980</span>
            <span className="text-xs text-muted-foreground font-sans">/ 月（税込）</span>
          </div>
        </div>

        {/* Features List */}
        <ul className="space-y-4 text-sm text-slate-600">
          {[
            "思考を永続保存",
            "人生のアーカイブ",
            "第二の脳として育てる",
            "AIによる振り返り内容の自動整理",
            "今の自分に最適なAIロード整理",
          ].map((feature, idx) => (
            <li key={idx} className="flex items-start space-x-3">
              <Check className="w-4.5 h-4.5 text-slate-450 stroke-[2] shrink-0 mt-0.5" />
              <span className="leading-normal">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Subscribe Button */}
        <div className="pt-4 space-y-4">
          {turnstileSiteKey && !isPremium && (
            <div className="flex justify-center h-[65px] items-center">
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: "light",
                  size: "invisible",
                }}
              />
            </div>
          )}
          {isPremium ? (
            <div className="space-y-3">
              <p className="text-center text-xs text-emerald-600 bg-emerald-50 py-2.5 rounded-xl border border-emerald-100 font-medium">
                現在 Premiumプラン利用中です
              </p>
              <button
                onClick={() => router.push("/member/settings")}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 transition-colors text-sm"
              >
                <span>設定ページへ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading || status === "loading" || (!turnstileToken && !!turnstileSiteKey)}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-foreground font-medium py-3 transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>チェックアウトへ移動中...</span>
                </>
              ) : (
                <span>Premiumへ参加</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Trust Badge */}
      <p className="text-center text-[10px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
        ※ クレジットカード決済はStripeの保護された安全な決済システム（Stripe Hosted Checkout）を利用しており、当サービスのサーバーにはカード情報は一切保存されません。
      </p>
    </div>
  );
}
