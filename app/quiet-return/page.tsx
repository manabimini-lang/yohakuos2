import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  description: "静かに戻ってくる断片を感じる。",
};

export default async function QuietReturnPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch user AI settings
  const userAiSettings = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  // In parallel: detect all return patterns
  const [fragments, echoes, resurfacings] = await Promise.all([
    detectReturningFragments(userId),
    detectTemporalEchoes(userId),
    detectCalmResurfacing(userId),
  ]);

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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 space-y-8">
        {/* Title */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-black/90 dark:text-white/90">
            静かな戻り
          </h1>

          {/* Navigation to Memory */}
          <nav className="flex gap-3">
            <Link 
              href="/memory"
              className="flex-1 px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-center group"
            >
              <p className="text-xs font-light tracking-widest text-black/40 dark:text-white/40 uppercase group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">記憶の地層</p>
              <p className="text-xs font-light text-black/60 dark:text-white/60 mt-0.5">積み重ねられた記録</p>
            </Link>
            <Link 
              href="/quiet-return"
              className="flex-1 px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] text-center"
            >
              <p className="text-xs font-light tracking-widest text-black/50 dark:text-white/50 uppercase">現在地</p>
              <p className="text-xs font-light text-black/70 dark:text-white/70 mt-0.5">静かな戻り</p>
            </Link>
          </nav>

          {/* Philosophy introduction */}
          <div className="max-w-2xl space-y-4">
            <p className="text-base sm:text-lg font-light text-black/70 dark:text-white/70 leading-relaxed">
              存在は、ただ前へ進み続けるだけではない。
            </p>
            <p className="text-base sm:text-lg font-light text-black/60 dark:text-white/60 leading-relaxed">
              以前の断片や、遠い沈黙や、薄れていた余白は、
              <br />
              少し違う静けさで、また戻ってくることがある。
            </p>
          </div>

          {/* AI status */}
          {!userAiSettings?.isEnabled && (
            <div className="mt-8 p-4 sm:p-6 border border-black/10 dark:border-white/10 rounded-lg bg-black/2 dark:bg-white/2">
              <p className="text-sm font-light text-black/50 dark:text-white/50">
                AIが休んでいるため、静かな戻りは表示されません。
                <a
                  href="/settings/ai"
                  className="ml-2 underline opacity-70 hover:opacity-100 transition-opacity"
                >
                  設定を確認する
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32 pb-24 sm:pb-32">
        {hasReturns && userAiSettings?.isEnabled ? (
          <>
            {/* Returning fragments section */}
            {fragmentsWithNarrative.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
                    戻ってきた断片
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-white/50">
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
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
                    穏やかな再浮上
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-white/50">
                    長い沈黙のあと、小さな余白が戻ってきている
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
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
                    時間の響き
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-white/50">
                    遠く離れた時間で、似た言葉が静かに現れている
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
            <p className="text-lg sm:text-xl font-light text-black/50 dark:text-white/50">
              遠い断片が戻ってくるのを待っています。
            </p>
            <p className="text-sm font-light text-black/40 dark:text-white/40 max-w-md mx-auto leading-relaxed">
              YOHAKUで、十分な記録が積み重なると、
              <br />
              静かな戻りの流れが感じられるようになります。
            </p>
            <p className="text-xs font-light text-black/25 dark:text-white/25 pt-8">
              存在は、単なる積み重ねではなく、
              <br />
              静かな往来を繰り返しています。
            </p>
          </div>
        )}
      </div>

      {/* Footer philosophy */}
      <div className="border-t border-black/5 dark:border-white/5 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-light text-black/30 dark:text-white/30 tracking-widest uppercase">
            Quiet Return Philosophy
          </p>
          <p className="text-sm font-light text-black/40 dark:text-white/40 leading-relaxed">
            戻ることにも、静かな流れがある。
            <br />
            YOHAKUは、記録を積み重ねるだけでなく、
            <br />
            存在の非直線性を映す余白でもある。
          </p>
        </div>
      </div>
    </div>
  );
}
