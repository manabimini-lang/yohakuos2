import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAIAvailability } from "@/lib/ai/gemini";
import {
  detectReturningFragments,
  detectTemporalEchoes,
  detectCalmResurfacing,
  generateReturnNarrative,
  generateResurfacingNarrative,
  isSignificantReturn,
} from "@/lib/memory/return-engine";
import { EchoFragment } from "@/components/memory/EchoFragment";
import { CalmResurfacingCard } from "@/components/memory/CalmResurfacingCard";
import { TemporalEchoCard } from "@/components/memory/TemporalEchoCard";
import { ReturnDriftTimeline } from "@/components/memory/ReturnDriftTimeline";

export const metadata: Metadata = {
  title: "Quiet Return | YOHAKU",
  description: "過去の記録から、今に役立つ気づきを見つけます。",
};

export default async function QuietReturnPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // In parallel: fetch plan-aware AI access and return patterns.
  const [aiAvailability, fragments, echoes, resurfacings] = await Promise.all([
    checkAIAvailability(userId),
    detectReturningFragments(userId),
    detectTemporalEchoes(userId),
    detectCalmResurfacing(userId),
  ]);

  const hasAiAccess = aiAvailability.available;

  // Filter to only significant returns
  const significantFragments = fragments.filter(isSignificantReturn).slice(0, 4);

  // Generate narratives
  const fragmentsWithNarrative = significantFragments.map((f) => ({
    fragment: f,
    narrative: generateReturnNarrative(f),
  }));

  const resurfacingsWithNarrative = resurfacings.slice(0, 4).map((r) => ({
    resurfacing: r,
    narrative: generateResurfacingNarrative(r),
  }));

  const hasReturns =
    fragmentsWithNarrative.length > 0 ||
    resurfacingsWithNarrative.length > 0 ||
    echoes.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-foreground">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 space-y-8">
        {/* Title */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-black/90 dark:text-foreground/90">
            静かな戻り
          </h1>

          {/* Navigation to Memory */}
          <nav className="flex gap-3">
            <Link 
              href="/memory"
              className="flex-1 px-4 py-3 rounded-lg border border-black/10 dark:border-border bg-black/[0.02] dark:bg-card hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-center group"
            >
              <p className="text-xs font-light tracking-widest text-black/40 dark:text-foreground/40 uppercase group-hover:text-black/60 dark:group-hover:text-foreground/60 transition-colors">記憶の地層</p>
              <p className="text-xs font-light text-black/60 dark:text-foreground/60 mt-0.5">積み重ねられた記録</p>
            </Link>
            <Link 
              href="/quiet-return"
              className="flex-1 px-4 py-3 rounded-lg border border-black/10 dark:border-border bg-black/[0.04] dark:bg-white/[0.04] text-center"
            >
              <p className="text-xs font-light tracking-widest text-black/50 dark:text-foreground/50 uppercase">現在地</p>
              <p className="text-xs font-light text-black/70 dark:text-foreground/70 mt-0.5">過去の記録を見返す</p>
            </Link>
          </nav>

          {/* What this page does */}
          <div className="max-w-2xl space-y-4">
            <p className="text-base sm:text-lg font-light text-black/70 dark:text-foreground/70 leading-relaxed">
              以前に書いた記録を、今の自分に関係がありそうなタイミングで表示します。
            </p>
            <p className="text-base sm:text-lg font-light text-black/60 dark:text-foreground/60 leading-relaxed">
              繰り返し出てくるテーマや、まだ考え中のことを見つけて、
              <br />
              必要なら今日の行動に反映できます。
            </p>
          </div>

          {/* AI status */}
          {!hasAiAccess ? (
            <div className="mt-8 p-8 rounded-2xl border border-black/10 dark:border-border bg-black/[0.02] dark:bg-card space-y-4">
              <p className="text-sm text-black/80 dark:text-foreground/80 leading-relaxed font-light">
                AI接続がまだ行われていません。
              </p>
              <p className="text-xs text-black/50 dark:text-foreground/50 leading-relaxed font-light">
                AIを接続すると、保存した記録が静かに整えられ、パーソナルAIとの対話や、内面の風景の描画が始まります。PremiumはAPIキー不要です。
              </p>
              <Link 
                href="/yui/settings"
                className="inline-flex items-center text-xs font-light text-black/40 dark:text-foreground/40 hover:text-black/60 dark:hover:text-foreground/60 transition-colors group"
              >
                AI設定へ
                <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32 pb-24 sm:pb-32">
        {hasReturns && hasAiAccess ? (
          <>
            {/* Returning fragments section */}
            {fragmentsWithNarrative.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-foreground/80">
                    戻ってきた断片
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    遠い時間から静かに戻ってくる言葉たち
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
                  {fragmentsWithNarrative.map(({ fragment, narrative }, idx) => (
                    <EchoFragment
                      key={idx}
                      fragment={fragment}
                      narrative={narrative}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Calm resurfacing section */}
            {resurfacingsWithNarrative.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-foreground/80">
                    穏やかな再浮上
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    しばらく見ていなかった記録の中から、今に関係しそうなもの
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resurfacingsWithNarrative.map(({ resurfacing }, idx) => (
                    <CalmResurfacingCard key={idx} resurfacing={resurfacing} />
                  ))}
                </div>
              </section>
            )}

            {/* Temporal echoes section */}
            {echoes.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-foreground/80">
                    時間の響き
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    時期が違っても、似た言葉やテーマが出てきた記録
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {echoes.slice(0, 4).map((echo, idx) => (
                    <TemporalEchoCard key={idx} echo={echo} />
                  ))}
                </div>
              </section>
            )}

            {/* Return drift timeline */}
            <section className="space-y-12">
              <ReturnDriftTimeline
                fragments={fragmentsWithNarrative.map((x) => x.fragment)}
                resurfacings={resurfacingsWithNarrative.map((x) => x.resurfacing)}
              />
            </section>
          </>
        ) : (
          /* Empty state */
          <div className="py-24 sm:py-32 text-center space-y-6">
            <p className="text-lg sm:text-xl font-light text-black/50 dark:text-foreground/50">
              まだ見返せる記録がありません。
            </p>
            <p className="text-sm font-light text-black/40 dark:text-foreground/40 max-w-md mx-auto leading-relaxed">
              記録が増えると、過去の内容から
              <br />
              今に役立ちそうなものをここに表示します。
            </p>
            <p className="text-xs font-light text-black/25 dark:text-foreground/25 pt-8">
              まずは5件以上の記録を残してみてください。
            </p>
          </div>
        )}


      </div>

      {/* Footer philosophy */}
      <div className="border-t border-black/5 dark:border-border/50 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-light text-black/30 dark:text-foreground/30 tracking-widest uppercase">
            Quiet Return Philosophy
          </p>
          <p className="text-sm font-light text-black/40 dark:text-foreground/40 leading-relaxed">
            YOHAKUは、過去の記録を今の気づきに活かすための機能を提供します。
            <br />
            表示された内容は、いつでも非表示にできます。
          </p>
        </div>
      </div>
    </div>
  );
}
