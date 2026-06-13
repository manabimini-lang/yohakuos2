import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTodayDailyRitual } from "@/lib/memory/ritual";
import { QuietAudioPlayer } from "@/components/audio/QuietAudioPlayer";

export const metadata: Metadata = {
  title: "Ritual - YOHAKU",
  description: "人生の記録と静かに再会する、今日の余白の場。",
};

export default async function RitualPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ritual = await getTodayDailyRitual(session.user.id);
  const hasRitual = Boolean(ritual);

  const returningThemes = (ritual?.returningThemes ?? []) as Array<{
    name: string;
    cycleCount: number;
    gapDays: number;
    philosophy?: string;
    firstAppeared: string | Date;
    lastAppeared: string | Date;
  }>;

  const philosophyFragments = (ritual?.philosophyFragments ?? []) as Array<{
    fragment: string;
    sourceTheme: string;
  }>;

  const pastMemories = (ritual?.pastMemories ?? []) as Array<{
    source: string;
    title: string;
    snippet: string;
    date: string;
    tags: string[];
  }>;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-foreground selection:bg-black/10 dark:selection:bg-white/10">
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 pt-20 pb-24 space-y-16">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.28em] uppercase text-black/40 dark:text-foreground/40">
              今日の余白
            </p>
            <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-black/90 dark:text-foreground/90">
              人生との静かな再会の時間
            </h1>
          </div>

          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-black/60 dark:text-foreground/60 font-light">
            {hasRitual
              ? ritual?.ambientReflection
              : "まだ余白は静かに育っています。記録が重なるほど、過去と今のつながりが少しずつ見えてきます。"}
          </p>
        </section>

        {hasRitual ? (
          <div className="space-y-16">
            <section className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    今日の余白
                  </h2>
                  <p className="text-sm text-black/50 dark:text-foreground/50 font-light leading-relaxed">
                    今日は、記録と静かに再会する時です。答えを求めるのではなく、流れを感じてみてください。
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
                <div className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-8">
                  <p className="text-base leading-relaxed text-black/70 dark:text-foreground/70 whitespace-pre-wrap">
                    {ritual?.ambientReflection}
                  </p>
                </div>

                {ritual?.audioUrl && (
                  <div className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-8">
                    <div className="space-y-4">
                      <p className="text-xs tracking-[0.22em] uppercase text-black/40 dark:text-foreground/40">
                        今日の振り返りを聴く
                      </p>
                      <QuietAudioPlayer src={ritual.audioUrl} title="今日の静かな振り返り" duration={undefined} />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {pastMemories.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    以前の余白
                  </h2>
                  <p className="text-sm text-black/50 dark:text-foreground/50 font-light">
                    過去の記録と穏やかに再会します。
                  </p>
                </div>

                <div className="grid gap-6">
                  {pastMemories.slice(0, 2).map((memory, index) => (
                    <div key={index} className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-8">
                      <p className="text-xs text-black/40 dark:text-foreground/40 uppercase tracking-[0.24em] mb-4">
                        {memory.source}
                      </p>
                      <h3 className="text-xl font-medium text-black/85 dark:text-foreground/85 leading-snug">
                        {memory.title}
                      </h3>
                      <p className="mt-4 text-sm leading-relaxed text-black/70 dark:text-foreground/70 whitespace-pre-wrap">
                        {memory.snippet}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-black/40 dark:text-foreground/40">
                        {memory.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full border border-black/10 dark:border-border px-3 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                  静かな問い
                </h2>
                <p className="text-sm text-black/50 dark:text-foreground/50 font-light">
                  そのまま考えてみる余白です。
                </p>
              </div>

              <div className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-8">
                <p className="text-base leading-relaxed text-black/70 dark:text-foreground/70">
                  {ritual?.quietQuestion}
                </p>
              </div>
            </section>

            {returningThemes.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    何度も戻ってきていること
                  </h2>
                  <p className="text-sm text-black/50 dark:text-foreground/50 font-light">
                    あなたの記録の中で、繰り返し顔を出すテーマです。
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {returningThemes.slice(0, 4).map((theme, index) => (
                    <div key={index} className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-6">
                      <p className="text-lg font-medium text-black/80 dark:text-foreground/80">
                        {theme.name}
                      </p>
                      <p className="mt-2 text-sm text-black/50 dark:text-foreground/50 leading-relaxed">
                        {theme.cycleCount}度の異なる時期に帰ってきています。
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {philosophyFragments.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                    にじみ出ている価値観
                  </h2>
                  <p className="text-sm text-black/50 dark:text-foreground/50 font-light">
                    記録の中から浮かび上がる、あなた自身の考え方。
                  </p>
                </div>

                <div className="space-y-4">
                  {philosophyFragments.slice(0, 3).map((fragment, index) => (
                    <div key={index} className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-6">
                      <p className="text-base leading-relaxed text-black/70 dark:text-foreground/70 italic">
                        「{fragment.fragment}」
                      </p>
                      <p className="mt-3 text-xs text-black/40 dark:text-foreground/40">
                        テーマ: {fragment.sourceTheme}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-light text-black/85 dark:text-foreground/85">
                  流れのやわらかな線
                </h2>
                <p className="text-sm text-black/50 dark:text-foreground/50 font-light">
                  記録は、時とともに層を作っていきます。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {returningThemes.slice(0, 3).map((theme, index) => (
                  <div key={index} className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-6">
                    <p className="text-xs text-black/40 dark:text-foreground/40 uppercase tracking-[0.22em] mb-3">
                      {new Date(theme.firstAppeared).toLocaleDateString("ja-JP", { month: "short" })}
                    </p>
                    <p className="text-lg font-medium text-black/80 dark:text-foreground/80">
                      {theme.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <p className="text-xs tracking-[0.24em] uppercase text-black/40 dark:text-foreground/40">
                    静かな会話入口
                  </p>
                  <h2 className="text-2xl font-light text-black/85 dark:text-foreground/85">
                    最近の記録について、少し話してみますか？
                  </h2>
                </div>
                <Link
                  href="/companion"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-border bg-black/[0.04] dark:bg-white/[0.06] px-6 py-3 text-sm font-light text-black/80 dark:text-foreground/80 hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors"
                >
                  静かな対話を開く
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* Link to Inbox */}
            <div className="pt-16 pb-8 border-t border-black/5 dark:border-border/50 text-center">
              <Link 
                href="/inbox"
                className="inline-flex items-center text-xs font-light tracking-[0.1em] text-black/40 dark:text-foreground/40 hover:text-black/60 dark:hover:text-foreground/60 transition-colors group"
              >
                今日の記録へ戻る
                <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          <section className="rounded-[2rem] border border-black/10 dark:border-border bg-black/[0.02] dark:bg-white/[0.04] p-12 text-center space-y-6">
            <p className="text-sm text-black/50 dark:text-foreground/50 leading-relaxed font-light">
              まだ余白は静かに育っています。
              <br />
              記録が積み重なるほど、過去と今の再会が穏やかに深まります。
            </p>
            <div className="space-y-2">
              <p className="text-xs text-black/40 dark:text-foreground/40 uppercase tracking-[0.24em]">
                余白の感覚を大切に
              </p>
              <p className="text-xs text-black/30 dark:text-foreground/30 font-light leading-relaxed">
                今日の記録を残すだけで、人生の流れが少しずつ姿を現します。
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
