import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { QuietAudioPlayer } from "@/components/audio/QuietAudioPlayer";
import { QuietQuestionCard } from "@/components/learning/QuietQuestionCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearningFeedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const isPremium = session.user.role === "PAID_MEMBER" || session.user.role === "ADMIN";

  // Fetch recent audio reflections
  const audioReflections = await prisma.audioReflection.findMany({
    where: { userId, status: "completed" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Fetch learning suggestions
  const suggestions = await prisma.learningSuggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Fetch related content items and knowledge contents for suggestions
  const contentItemIds = suggestions
    .map(s => s.contentItemId)
    .filter(Boolean) as string[];
  const knowledgeContentIds = suggestions.map(s => s.knowledgeContentId);

  const contentItems = contentItemIds.length > 0
    ? await prisma.contentItem.findMany({
        where: { id: { in: contentItemIds } }
      })
    : [];

  const knowledgeContents = knowledgeContentIds.length > 0
    ? await prisma.knowledgeContent.findMany({
        where: { id: { in: knowledgeContentIds } }
      })
    : [];

  // Map related data to suggestions
  const enrichedSuggestions = suggestions.map(suggestion => ({
    ...suggestion,
    contentItem: contentItems.find(ci => ci.id === suggestion.contentItemId) || null,
    knowledgeContent: knowledgeContents.find(kc => kc.id === suggestion.knowledgeContentId) || null
  }));

  // Fetch resurfaced memories (Fogging applied for Free users if older than 3 days)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const memories = await prisma.memoryResurfacing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0A0A] text-black/80 dark:text-white/80 pb-20 selection:bg-black/10 dark:selection:bg-white/10">
      <main className="max-w-3xl mx-auto px-6 pt-24 md:pt-32 space-y-32">
        
        {/* Header section */}
        <section className="space-y-4">
          <h1 className="text-xl md:text-2xl font-light tracking-widest text-black/90 dark:text-white/90">
            静かに積層する学び
          </h1>
          <p className="text-sm md:text-base text-black/50 dark:text-white/50 leading-relaxed font-light">
            過去の記録が、ゆっくりとつながっていく場所。
          </p>
        </section>

        {/* Audio Reflections */}
        {audioReflections.length > 0 && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">Audio Reflections</h2>
            <div className="grid gap-6">
              {audioReflections.map((audio) => (
                <div key={audio.id} className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors">
                  <p className="text-sm leading-loose font-light mb-6 opacity-80 whitespace-pre-wrap">{audio.script}</p>
                  {audio.audioUrl && <QuietAudioPlayer src={audio.audioUrl} title="静かな振り返り" />}
                </div>
              ))}
            </div>
            <Link href="/reflections" className="inline-flex items-center text-xs text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors group">
              すべての振り返りを開く
              <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </section>
        )}

        {/* Quiet Questions */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-225 fill-mode-both">
          <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">静かな問い</h2>
          {enrichedSuggestions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-center space-y-3">
              <p className="text-sm text-black/40 dark:text-white/40 font-light">
                まだ静かな問いは浮かんでいません
              </p>
              <p className="text-xs text-black/25 dark:text-white/25 leading-relaxed font-light">
                記録を積み重ねることで、やがてその奥に隠された共通点が見えてきます。
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {enrichedSuggestions.map((suggestion) => (
                <QuietQuestionCard key={suggestion.id} suggestion={suggestion as any} />
              ))}
            </div>
          )}
        </section>

        {/* Resurfaced Memories with Decay Logic */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
          <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">Resurfaced Memories</h2>
          <div className="grid gap-12">
            {memories.length === 0 && (
              <p className="text-sm text-black/30 dark:text-white/30 italic">記憶が降り積もるのを待っています...</p>
            )}
            {memories.map((memory) => {
              const isFogged = !isPremium && memory.createdAt < threeDaysAgo;
              
              return (
                <div key={memory.id} className={`group relative space-y-4 pl-4 border-l ${isFogged ? 'border-black/5 dark:border-white/5 opacity-50' : 'border-black/10 dark:border-white/10'}`}>
                  {isFogged && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FDFDFD]/80 to-[#FDFDFD] dark:via-[#0A0A0A]/80 dark:to-[#0A0A0A] backdrop-blur-[2px] z-10" />
                  )}
                  <p className="text-xs font-mono text-black/30 dark:text-white/30">
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm leading-relaxed font-light text-black/70 dark:text-white/70">
                    {memory.message}
                  </p>
                  {isFogged && (
                    <p className="absolute bottom-0 text-xs text-black/30 dark:text-white/30 italic z-20">
                      記録が霧化しました。
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
