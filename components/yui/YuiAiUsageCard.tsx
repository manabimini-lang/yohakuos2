"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

type Usage = { plan: "free" | "premium"; used: number; limit: number; remaining: number; resetAt: string };

export function YuiAiUsageCard() {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/yui/ai-usage", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.limit) setUsage(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  if (!usage) return null;
  const percentage = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const resetDate = new Date(usage.resetAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
  const isPremium = usage.plan === "premium";

  return (
    <Card className="space-y-4 border-primary/20 bg-background/90 p-6 shadow-sm md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">AI Usage</p>
          <h2 className="mt-2 text-lg font-semibold">今月のAI利用状況</h2>
        </div>
        <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
          {isPremium ? "Premium" : "無料プラン"} · 月{usage.limit}回
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">{usage.used}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {usage.limit}回</span></p>
        <p className="text-xs text-muted-foreground">残り {usage.remaining}回</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`AI利用${percentage}%`}>
        <div className={`h-full rounded-full transition-all ${percentage >= 90 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs leading-5 text-muted-foreground">会話・提案・要約・写真解析など、外部AIへのリクエスト単位で数えます。毎月{resetDate}にリセットされます。</p>
      {!isPremium ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3">
          <p className="text-xs leading-5 text-amber-900">Premiumなら月500回まで。朝晩の秘書レポートも予定時刻に自動で整えます。</p>
          <Link href="/pricing" className="shrink-0 text-xs font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-700">
            詳細を見る
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
