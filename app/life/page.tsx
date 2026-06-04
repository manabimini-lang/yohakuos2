import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { checkAIAvailability } from "@/lib/ai/gemini";
import {
  extractLifeThemes,
  detectReturningThemes,
  extractPhilosophyFragments,
  detectLifeDirection,
  type LifeTheme,
  type ReturningTheme,
  type PhilosophyFragment,
} from "@/lib/life/life-themes-engine";
import { LifeThemeCard } from "@/components/life/LifeThemeCard";
import { ReturningThemesSection } from "@/components/life/ReturningThemesSection";
import { PhilosophyFragmentsSection } from "@/components/life/PhilosophyFragmentsSection";
import { LifeDirection } from "@/components/life/LifeDirection";

export const metadata: Metadata = {
  title: "Life OS - YOHAKU",
  description: "人生の流れを静かに見つめる。",
};

export default async function LifePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Check AI connection status
  const hasAiConnection = await checkAIAvailability(userId);

  // Check if user has enough data
  const itemCount = await prisma.contentItem.count({
    where: {
      userId,
      memoryState: "active",
    },
  });

  // In parallel: fetch all life OS data
  let themes: LifeTheme[] = [];
  let returningThemes: ReturningTheme[] = [];
  let philosophyFragments: PhilosophyFragment[] = [];
  let lifeDirection: string = "";

  if (hasAiConnection && itemCount >= 20) {
    [themes, returningThemes, philosophyFragments, lifeDirection] = await Promise.all([
      extractLifeThemes(userId, 6),
      detectReturningThemes(userId),
      extractPhilosophyFragments(userId),
      detectLifeDirection(userId),
    ]);
  } else {
    lifeDirection = "人生の輪郭はまだ静かに育っています。";
  }

  const hasData = themes.length > 0 || returningThemes.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 space-y-8">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-black/90 dark:text-white/90">
            人生の層
          </h1>

          <p className="text-base sm:text-lg font-light text-black/70 dark:text-white/70 leading-relaxed max-w-2xl">
            あなたの記録から、
            <br />
            人生の流れと方向性が、静かに浮かび上がる。
          </p>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            href="/memory"
            className="flex-1 px-6 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-center group"
          >
            <p className="text-xs font-light tracking-widest text-black/40 dark:text-white/40 uppercase group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">
              記憶の地層
            </p>
            <p className="text-xs font-light text-black/60 dark:text-white/60 mt-0.5">
              月ごとの記録
            </p>
          </Link>
          <Link
            href="/life"
            className="flex-1 px-6 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] text-center"
          >
            <p className="text-xs font-light tracking-widest text-black/50 dark:text-white/50 uppercase">
              現在地
            </p>
            <p className="text-xs font-light text-black/70 dark:text-white/70 mt-0.5">
              人生の層
            </p>
          </Link>
          <Link
            href="/legacy"
            className="flex-1 px-6 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-center"
          >
            <p className="text-xs font-light tracking-widest text-black/50 dark:text-white/50 uppercase">
              遺産
            </p>
            <p className="text-xs font-light text-black/70 dark:text-white/70 mt-0.5">
              軌跡を見る
            </p>
          </Link>
        </nav>

        {!hasAiConnection ? (
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4 max-w-xl">
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-light">
              AI接続がまだ行われていません。
            </p>
            <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed font-light">
              Gemini APIキーを設定すると、保存した記録が静かに整えられ、パーソナルAIとの対話や、内面の風景の描画が始まります。
            </p>
            <Link 
              href="/settings/ai"
              className="inline-flex items-center text-xs font-light text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors group"
            >
              AI設定へ
              <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : !hasData ? (
          <p className="text-sm font-light text-black/60 dark:text-white/60 leading-relaxed">
            人生のテーマを見つけるには、
            <br />
            もう少し記録が必要です。
            <br />
            <span className="text-xs text-black/40 dark:text-white/40 mt-2 inline-block">
              (現在: {itemCount} / 必要: 20 記録)
            </span>
          </p>
        ) : null}
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32 pb-24 sm:pb-32">
        {hasData && hasAiConnection ? (
          <>
            {/* Life Direction Section */}
            <LifeDirection
              direction={lifeDirection}
              themes={themes.map((t) => t.name)}
            />

            {/* Main Themes Section */}
            {themes.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
                    人生を形作っているテーマ
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-white/50">
                    ここ数ヶ月、静かに続いている関心
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {themes.slice(0, 6).map((theme, idx) => (
                    <LifeThemeCard key={idx} theme={theme} />
                  ))}
                </div>
              </section>
            )}

            {/* Returning Themes Section */}
            {returningThemes.length > 0 && (
              <ReturningThemesSection themes={returningThemes} />
            )}

            {/* Philosophy Fragments Section */}
            {philosophyFragments.length > 0 && (
              <PhilosophyFragmentsSection fragments={philosophyFragments} />
            )}
          </>
        ) : !hasAiConnection ? (
          /* AI disabled simple state */
          <div className="py-24 text-center space-y-4">
            <p className="text-sm font-light text-black/30 dark:text-white/30 italic">
              AI接続設定を完了すると、あなたの人生の層を静かに紐解くことができます。
            </p>
          </div>
        ) : (
          /* Empty state */
          <div className="py-24 sm:py-32 text-center space-y-8">
            <div className="space-y-4">
              <p className="text-lg sm:text-xl font-light text-black/60 dark:text-white/60">
                人生の輪郭はまだ静かに育っています。
              </p>
              <p className="text-sm font-light text-black/45 dark:text-white/45 max-w-md mx-auto leading-relaxed">
                記録が積み重なると、
                <br />
                テーマや方向性が少しずつ見えてきます。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/log"
                className="px-6 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-sm font-light text-black/70 dark:text-white/70"
              >
                記録を始める
              </Link>
              <Link
                href="/memory"
                className="px-6 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-sm font-light text-black/70 dark:text-white/70"
              >
                記憶を見る
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="border-t border-black/5 dark:border-white/5 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-light text-black/30 dark:text-white/30 tracking-widest uppercase">
            Life OS Philosophy
          </p>
          <p className="text-sm font-light text-black/40 dark:text-white/40 leading-relaxed max-w-lg mx-auto">
            YOHAKUの人生OS は、あなたの人生を管理するものではなく、
            <br />
            その流れを静かに映す余白です。
            <br />
            <br />
            自分はどこへ向かっているのか、
            <br />
            その問いに、そっと答えを寄せる。
          </p>
        </div>
      </div>
    </div>
  );
}