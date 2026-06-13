"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { simulateSubscriptionAction } from "@/lib/actions/subscription/simulate-stripe";

function CheckoutMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const priceId = searchParams.get("priceId") || "price_standard";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await simulateSubscriptionAction(priceId);
      if (res.ok) {
        router.push("/member/settings?success=true");
      } else {
        setError(res.error || "決済シミュレーションに失敗しました。");
      }
    } catch (e) {
      setError("予期しないエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 selection:bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            テスト環境・シミュレーター
          </div>
          <h1 className="text-xl font-medium text-foreground tracking-tight pt-2">
            YOHAKU 会員プランの有効化
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stripeキーが設定されていないため、安全な模擬決済ページにリダイレクトされました。
            本番同様の会員ステータス（1年間有効）を即座に付与します。
          </p>
        </div>

        {/* Pricing Detail Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">対象プラン</span>
            <span className="font-medium text-foreground">YOHAKU 会員プラン (月額)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">請求額 (シミュレーション)</span>
            <span className="font-semibold text-foreground text-base">¥980 / 月</span>
          </div>
          <div className="pt-3 border-t border-slate-200/50 text-[11px] text-muted-foreground leading-relaxed">
            ※ 実際の決済やカード情報の入力は一切発生しません。
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-rose-600 text-center font-medium bg-rose-50 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "処理しています..." : "テスト決済を完了し、会員になる"}
          </button>
          <button
            onClick={() => router.push("/member/settings")}
            disabled={isLoading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            キャンセルして戻る
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutMockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-mono tracking-widest animate-pulse">読み込んでいます...</p>
      </div>
    }>
      <CheckoutMockContent />
    </Suspense>
  );
}
