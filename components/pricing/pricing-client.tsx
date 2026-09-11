"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, ArrowRight } from "lucide-react";
import { AI_MONTHLY_REQUEST_LIMIT, hasPremiumAccess } from "@/lib/constants/plan";
import Link from "next/link";
import { PricingComparison } from "@/components/public/pricing-comparison";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { createStripeCheckoutSession } from "@/app/actions/stripe-checkout";

export function PricingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const isPremium = !!session?.user && hasPremiumAccess(
    (session.user as any).plan,
    (session.user as any).role
  );

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const resetTurnstile = () => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const createCheckout = async (token: string) => {
    setLoading(true);
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
      if (!priceId) {
        resetTurnstile();
        alert("Stripe Price IDが設定されていません。管理者にお問い合わせください。");
        return;
      }

      const res = await createStripeCheckoutSession({ 
        priceId, 
        turnstileToken: token || "test-token" // allow dev bypass if no sitekey
      });

      if (!res.success || !res.url) {
        resetTurnstile();
        alert(res.error || "通信中にエラーが発生しました。");
        return;
      }

      window.location.href = res.url;
    } catch (error) {
      console.error(error);
      resetTurnstile();
      alert("通信中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/pricing")}`);
      return;
    }

    if (isPremium) return;

    if (turnstileSiteKey && !turnstileToken) {
      setAwaitingVerification(true);
      setLoading(true);
      turnstileRef.current?.execute();
      return;
    }

    void createCheckout(turnstileToken || "test-token");
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) throw new Error("支払い設定ページを開けませんでした");
      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "支払い設定ページを開けませんでした");
    } finally {
      setPortalLoading(false);
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
        <h1 className="text-3xl font-serif text-slate-850 tracking-wide mt-2">使い方に合わせて選ぶ料金プラン</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          無料版で日々の記録と相談を始められます。相談をもっと使いたい方や、朝晩の情報整理を自動化したい方にはPremiumをご用意しています。
        </p>
      </div>

      <PricingComparison />

      <section className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50 p-6 text-sm leading-7 text-sky-950">
        <h2 className="font-semibold">AI利用料も含まれるPremium</h2>
        <p>PremiumはGemini APIキーの設定が不要で、AI利用料も月額980円（税込）に含まれます。AI相談・提案・要約・自動レポートなどのAI処理は、合計で月500回まで利用できます。</p>
        <p>無料プランでAI相談を使う場合は、ご自身のGeminiまたはGroq APIキーを登録して利用します。メモ・タスク・振り返りはAI設定なしで使えます。</p>
        {!isPremium ? <Link href="/yui/settings#ai" className="inline-block font-medium underline underline-offset-4">無料プランのAI設定を確認する</Link> : null}
      </section>

      {!isPremium ? <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">まずは無料で試す</h2>
        <p className="text-sm leading-7 text-muted-foreground">メモを残し、今日やることを1つ決めて、結果を振り返るところから始められます。</p>
        <Link href={session?.user ? "/yui" : "/signup"} className="inline-block rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium">{session?.user ? "無料プランでホームへ" : "無料で始める"}</Link>
        <Link href="/help" className="ml-4 inline-block text-sm underline underline-offset-4">使い方を見る</Link>
      </section> : null}

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
            `AI利用を月${AI_MONTHLY_REQUEST_LIMIT.PREMIUM}回まで拡張`,
            "朝晩の秘書レポートを自動作成",
            "接続済みの予定・メールをレポート作成前に自動更新",
            "加入後に保存するURL・PDF・写真に保存期限を設定しない",
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
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  if (awaitingVerification) {
                    setAwaitingVerification(false);
                    void createCheckout(token);
                  }
                }}
                onError={() => {
                  resetTurnstile();
                  setAwaitingVerification(false);
                  setLoading(false);
                }}
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
                onClick={() => router.push("/yui/settings")}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 transition-colors text-sm"
              >
                <span>設定ページへ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleManageSubscription()}
                disabled={portalLoading}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {portalLoading ? "準備中..." : "支払い設定・解約"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading || status === "loading"}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50"
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
