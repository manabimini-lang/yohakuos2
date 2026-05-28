import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { QuietAudioPlayer } from "@/components/audio/QuietAudioPlayer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReflectionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const isPremium = session.user.role === "PAID_MEMBER" || session.user.role === "ADMIN";

  // Check AI connection status
  const userSettings = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  const audioReflections = await prisma.audioReflection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: isPremium ? 50 : 10,
  });

  // Split reflections: latest vs past
  const latestReflection = audioReflections[0] || null;
  const pastReflections = audioReflections.slice(1);

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0A0A] text-black/80 dark:text-white/80 pb-32 selection:bg-black/10 dark:selection:bg-white/10">
      <main className="max-w-3xl mx-auto px-6 pt-24 md:pt-32 space-y-32">
        
        {/* Header section */}
        <section className="space-y-6">
          <h1 className="text-xl md:text-2xl font-light tracking-widest text-black/90 dark:text-white/90">
            夜の机
          </h1>
          <p className="text-sm md:text-base text-black/50 dark:text-white/50 leading-relaxed font-light">
            言葉にならないものが、静かに語り返してくる空間。
          </p>
        </section>

        {/* AI Not Connected Notice */}
        {!userSettings?.isEnabled && (
          <section className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
            <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed font-light">
              AIを接続すると、
              <br />
              記録をもとに静かな振り返りが生成されます。
            </p>
            <Link 
              href="/settings/ai"
              className="inline-flex items-center text-xs font-light text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors group"
            >
              AI設定を開く
              <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </section>
        )}

        {/* Latest Reflection (Today's Margin) */}
        {latestReflection ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
              今日の余白
            </h2>
            
            <div className="group space-y-8">
              <div className="flex items-center gap-4 text-xs font-mono text-black/40 dark:text-white/40">
                <span className="w-8 h-[1px] bg-black/10 dark:bg-white/10" />
                {new Date(latestReflection.createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>
              
              <div className="pl-12 space-y-6">
                <p className="text-sm md:text-base leading-loose font-light text-black/70 dark:text-white/70 whitespace-pre-wrap">
                  {latestReflection.script}
                </p>

                {latestReflection.status === "completed" && latestReflection.audioUrl && (
                  <div className="pt-4">
                    <QuietAudioPlayer 
                      src={latestReflection.audioUrl} 
                      title="静かな振り返り" 
                    />
                  </div>
                )}
                
                {latestReflection.status === "pending" && (
                  <p className="text-xs text-black/40 dark:text-white/40 italic font-light">
                    (音声を生成しています...)
                  </p>
                )}

                {latestReflection.status === "failed" && (
                  <div className="text-xs text-black/40 dark:text-white/40 italic font-light space-y-2">
                    <p>生成に失敗しました。</p>
                    <Link
                      href={`/reflections/${latestReflection.id}/retry`}
                      className="inline-flex items-center text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors group"
                    >
                      もう一度試す
                      <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}

                {latestReflection.duration && (
                  <div className="text-[10px] text-black/30 dark:text-white/30 font-light">
                    再生時間: {Math.round(latestReflection.duration / 60)}分
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
              今日の余白
            </h2>
            <div className="p-8 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-center space-y-4">
              <p className="text-sm text-black/40 dark:text-white/40 font-light">
                まだ振り返りは静かに育っています
              </p>
              <p className="text-xs text-black/25 dark:text-white/25 leading-relaxed font-light">
                記録が積み重なると、
                <br />
                少しずつ思考の輪郭が見えてきます。
              </p>
            </div>
          </section>
        )}

        {/* Past Reflections */}
        {pastReflections.length > 0 && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
              過去の振り返り
            </h2>
            <div className="space-y-16">
              {pastReflections.map((audio, index) => (
                <div 
                  key={audio.id} 
                  className="group space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4 text-xs font-mono text-black/40 dark:text-white/40">
                    <span className="w-8 h-[1px] bg-black/10 dark:bg-white/10" />
                    {new Date(audio.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                  
                  <div className="pl-12 space-y-6">
                    <p className="text-sm leading-loose font-light text-black/60 dark:text-white/60 line-clamp-3 whitespace-pre-wrap">
                      {audio.script}
                    </p>

                    <div className="flex items-center justify-between gap-4 text-xs">
                      {audio.status === "completed" && audio.audioUrl && (
                        <QuietAudioPlayer 
                          src={audio.audioUrl} 
                          title="静かな振り返り" 
                        />
                      )}
                      
                      {audio.status === "pending" && (
                        <p className="text-black/30 dark:text-white/30 italic font-light">
                          生成中...
                        </p>
                      )}

                      {audio.duration && (
                        <div className="text-black/30 dark:text-white/30 font-light whitespace-nowrap">
                          {Math.round(audio.duration / 60)}分
                        </div>
                      )}

                      <Link
                        href={`/reflections/${audio.id}`}
                        className="text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {audioReflections.length === 0 && userSettings?.isEnabled && (
          <section className="text-center space-y-4">
            <p className="text-sm text-black/30 dark:text-white/30 italic font-light">
              記憶が降り積もるのを待っています...
            </p>
          </section>
        )}

        {!isPremium && audioReflections.length >= 10 && (
          <div className="pt-16 border-t border-black/5 dark:border-white/5 text-center">
            <p className="text-xs text-black/30 dark:text-white/30 font-light">
              これより古い記憶は霧の中に沈んでいます。
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
