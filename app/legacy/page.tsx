import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLegacyPageData, getLatestLegacySnapshot, getSeasonLabel } from "@/lib/legacy/legacy-engine";

export const metadata: Metadata = {
  title: "Legacy - YOHAKU",
  description: "時間とともに静かに残る、人生の軌跡。",
};

export default async function LegacyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [legacy, latestSnapshot] = await Promise.all([
    getLegacyPageData(session.user.id),
    getLatestLegacySnapshot(session.user.id),
  ]);

  const hasData = legacy.seasonalSummaries.length > 0 || legacy.returningThemes.length > 0 || legacy.pastLetters.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-foreground selection:bg-black/10 dark:selection:bg-white/10">
      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 pt-20 pb-24 space-y-16">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.28em] uppercase text-black/40 dark:text-foreground/40">
              Legacy Layer
            </p>
            <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-black/90 dark:text-foreground/90">
              人生の軌跡が静かに残る空間
            </h1>
          </div>

          <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-black/60 dark:text-foreground/60 font-light">
            記録は単なる履歴ではありません。時間を重ねた空気感と、何度も戻ってきたテーマのかたちを、静かに見つめる場所です。
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-5 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">Legacy Snapshot</p>
              <p className="text-sm text-stone-700 dark:text-stone-200 font-light leading-relaxed">
                {latestSnapshot
                  ? `最後に生成されたスナップショット: ${new Date(latestSnapshot.updatedAt).toLocaleDateString("ja-JP")}`
                  : "長期の記録が蓄積されると、ここに静かなまとめが生まれます。"}
              </p>
            </div>

            <Link
              href="/legacy/export"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-border bg-black/[0.04] dark:bg-white/10 px-5 py-3 text-sm font-light text-black/70 dark:text-foreground/70 hover:bg-black/[0.08] dark:hover:bg-white/15 transition-colors"
            >
              スナップショットをテキストで見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {hasData ? (
          <div className="space-y-16">
            <section className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                  Legacy Timeline
                </h2>
                <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                  長期の季節とテーマを、静かに順番にたどります。
                </p>
              </div>

              <div className="space-y-4">
                {legacy.timelineEntries.map((entry, index) => (
                  <div key={index} className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400 mb-3">
                      {entry.label}
                    </p>
                    <h3 className="text-xl font-light text-black/85 dark:text-foreground/85 leading-snug">
                      {entry.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {legacy.seasonalSummaries.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    季節の空気感
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    季節ごとの静かな変化を、そのまま残します。
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {legacy.seasonalSummaries.slice(-4).reverse().map((summary, index) => (
                    <div key={index} className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400 mb-3">
                        {getSeasonLabel(summary.season)} {summary.year}
                      </p>
                      <p className="text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                        {summary.summary}
                      </p>
                      {Array.isArray(summary.themes) && summary.themes.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {summary.themes.slice(0, 4).map((theme, themeIdx) => (
                            <span key={themeIdx} className="text-[11px] text-stone-500 dark:text-stone-300 rounded-full border border-stone-200 dark:border-stone-700 px-3 py-1">
                              {theme}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {legacy.returningThemes.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    何度も戻ってきていること
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    人生のテーマは、直線ではなく、何度も戻るかたちを持っています。
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {legacy.returningThemes.slice(0, 4).map((theme, index) => (
                    <div key={index} className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                      <h3 className="text-xl font-light text-black/85 dark:text-foreground/85">
                        「{theme.name}」
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                        {theme.cycleCount}度の異なる時期に、そのテーマが戻ってきています。
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {legacy.philosophyDrift && (
              <section className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-xs uppercase tracking-[0.24em]">Philosophy Drift</p>
                  </div>
                  <h2 className="text-2xl font-light text-black/85 dark:text-foreground/85">
                    思想の変化を静かに映す
                  </h2>
                  <p className="text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                    {legacy.philosophyDrift.text}
                  </p>
                </div>
              </section>
            )}

            {legacy.resonancePath.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    Legacy Resonance
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    長く続くテーマの間に、静かなつながりが見えてきます。
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                  <p className="text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                    {legacy.resonancePath.join(" \u21C5 ")}
                  </p>
                </div>
              </section>
            )}

            {legacy.pastLetters.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    以前の余白
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    過去の自分が残した声が、時間を隔てて戻ってきます。
                  </p>
                </div>

                <div className="grid gap-4">
                  {legacy.pastLetters.map((letter) => (
                    <div key={letter.id} className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400 mb-3">
                        {letter.date}
                      </p>
                      <p className="text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                        {letter.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {legacy.lifeChapters.length > 0 && (
              <section className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    Life Chapters
                  </h2>
                  <p className="text-sm font-light text-black/50 dark:text-foreground/50">
                    時期ごとのやわらかな章立てです。評価ではなく、流れを写しています。
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {legacy.lifeChapters.map((chapter, index) => (
                    <div key={index} className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400 mb-3">
                        {chapter.periodLabel}
                      </p>
                      <h3 className="text-lg font-light text-black/85 dark:text-foreground/85">
                        {chapter.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-black/60 dark:text-foreground/60">
                        {chapter.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
                    Companion Legacy Awareness
                  </p>
                  <h2 className="text-2xl font-light text-black/85 dark:text-foreground/85">
                    Companionは、長期の流れをそっと参照します
                  </h2>
                </div>
                <Link
                  href="/companion"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-border bg-black/[0.04] dark:bg-white/10 px-5 py-3 text-sm font-light text-black/70 dark:text-foreground/70 hover:bg-black/[0.08] dark:hover:bg-white/15 transition-colors"
                >
                  余白を話す
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <section className="rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-card p-12 text-center">
            <p className="text-lg font-light text-black/70 dark:text-foreground/70 leading-relaxed">
              まだ人生の軌跡は静かに育っています。
            </p>
            <p className="mt-4 text-sm font-light text-black/50 dark:text-foreground/50 leading-relaxed">
              時間が積み重なると、少しずつ流れが見えてきます。記録を続けるほど、過去の季節やテーマがやわらかく繋がっていきます。
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
