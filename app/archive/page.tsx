import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  detectReturningFragments,
  detectTemporalEchoes,
  detectCalmResurfacing,
  isSignificantReturn,
} from "@/lib/memory/return-engine";
import { detectReturningThemes } from "@/lib/life/life-themes-engine";
import { getLatestPhilosophyFragments } from "@/lib/memory/philosophy";
import { checkAIAvailability } from "@/lib/ai/gemini";
import { EchoFragment } from "@/components/memory/EchoFragment";
import { CalmResurfacingCard } from "@/components/memory/CalmResurfacingCard";
import { TemporalEchoCard } from "@/components/memory/TemporalEchoCard";
import { ReturnDriftTimeline } from "@/components/memory/ReturnDriftTimeline";

export const metadata: Metadata = {
  title: "Archive | YOHAKU",
  description: "過去の記録が今のあなたと静かにつながる場所。",
};

export default async function ArchivePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const aiResult = await checkAIAvailability(userId);

  const [resurfacedMemories, fragments, echoes, resurfacings, returningThemes, philosophyFragments] = await Promise.all([
    prisma.memoryResurfacing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    detectReturningFragments(userId),
    detectTemporalEchoes(userId),
    detectCalmResurfacing(userId),
    detectReturningThemes(userId),
    getLatestPhilosophyFragments(userId, 4),
  ]);

  const significantFragments = fragments.filter(isSignificantReturn).slice(0, 4);
  const hasArchiveItems =
    resurfacedMemories.length > 0 ||
    significantFragments.length > 0 ||
    resurfacings.length > 0 ||
    echoes.length > 0 ||
    returningThemes.length > 0 ||
    philosophyFragments.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-10">
        <div className="space-y-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-black/40 dark:text-white/40">Living Archive</p>
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-black/90 dark:text-white/90">
              過去の記録が、静かに今と再会する場所
            </h1>
            <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
              YOHAKUのArchiveは、積み重ねられた記録の中で、意味がゆっくりと再び響くための余白です。
              <br />
              霧のように遠い断片や、季節を越えて戻ってくるテーマを、静かに感じ取ります。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/quiet-return"
              className="flex-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4 transition hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-black/40 dark:text-white/40">静かな戻り</p>
              <p className="text-sm mt-2 text-black/70 dark:text-white/70">Archiveとは別の視点で、戻ってくる余白を味わう。</p>
            </Link>
            <Link
              href="/learning"
              className="flex-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4 transition hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-black/40 dark:text-white/40">静かな学び</p>
              <p className="text-sm mt-2 text-black/70 dark:text-white/70">過去の再発見が、ゆっくりと学びの層をつくる。</p>
            </Link>
          </div>

          {!aiResult.available && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] p-5">
              <p className="text-sm text-black/50 dark:text-white/50">
                AIが無効になっています。Archiveは過去のしずかな再会を支えるために、AIの静かな処理を使っています。
              </p>
            </div>
          )}
        </div>

        {hasArchiveItems ? (
          <div className="space-y-16">
            {resurfacedMemories.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light text-black/80 dark:text-white/80">再発見された記憶</h2>
                    <p className="text-sm text-black/50 dark:text-white/50">時間の中で静かにつながった、過去と今のひかり。</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-black/30 dark:text-white/30">{resurfacedMemories.length} 件</p>
                </div>

                <div className="grid gap-6">
                  {resurfacedMemories.map((memory) => (
                    <div key={memory.id} className="rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-6">
                      <p className="text-xs text-black/40 dark:text-white/40 mb-3">{new Date(memory.createdAt).toLocaleDateString("ja-JP")}</p>
                      <p className="text-base leading-relaxed text-black/70 dark:text-white/70">{memory.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(significantFragments.length > 0 || resurfacings.length > 0) && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-light text-black/80 dark:text-white/80">Archive Revisit</h2>
                  <p className="text-sm text-black/50 dark:text-white/50">遠い沈黙を越えて、何かがまた顔を出すとき。</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {significantFragments.map((fragment) => (
                    <EchoFragment key={fragment.id} fragment={fragment} narrative={fragment.resurfaceContext} />
                  ))}
                  {resurfacings.slice(0, 4).map((resurfacing) => (
                    <CalmResurfacingCard key={resurfacing.id} resurfacing={resurfacing} />
                  ))}
                </div>
              </section>
            )}

            {echoes.length > 0 && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-light text-black/80 dark:text-white/80">季節の共鳴</h2>
                  <p className="text-sm text-black/50 dark:text-white/50">異なる時間帯に、似た言葉がそっと重なる。</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {echoes.slice(0, 4).map((echo) => (
                    <TemporalEchoCard key={echo.id} echo={echo} />
                  ))}
                </div>
              </section>
            )}

            {(returningThemes.length > 0 || philosophyFragments.length > 0) && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-light text-black/80 dark:text-white/80">意味の漂い</h2>
                  <p className="text-sm text-black/50 dark:text-white/50">過去に繰り返し現れるテーマが、静かに形を縁取る。</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {returningThemes.length > 0 && (
                    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-6">
                      <p className="text-xs uppercase tracking-[0.28em] text-black/30 dark:text-white/30 mb-4">帰ってくるテーマ</p>
                      <div className="space-y-4">
                        {returningThemes.slice(0, 4).map((theme) => (
                          <div key={theme.name} className="space-y-1">
                            <p className="text-sm text-black/70 dark:text-white/70">「{theme.name}」</p>
                            <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">
                              {theme.philosophy ?? "いつも静かに戻ってくるテーマです。"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {philosophyFragments.length > 0 && (
                    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-6">
                      <p className="text-xs uppercase tracking-[0.28em] text-black/30 dark:text-white/30 mb-4">哲学の余韻</p>
                      <div className="space-y-4">
                        {philosophyFragments.map((fragment) => (
                          <p key={fragment.id} className="text-sm text-black/70 dark:text-white/70 leading-relaxed">
                            “{fragment.fragment}”
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <ReturnDriftTimeline
                fragments={significantFragments}
                resurfacings={resurfacings.slice(0, 4)}
              />
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-16 text-center">
            <p className="text-lg text-black/60 dark:text-white/60">Archiveがゆっくりと準備されています。</p>
            <p className="text-sm text-black/40 dark:text-white/40 mt-4">しばらく記録を続けると、過去の余白が静かに再び響きはじめます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
