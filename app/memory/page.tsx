import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMemoryTimeline } from "@/lib/memory/timeline-builder";
import { MemoryTimeline } from "@/components/memory/MemoryTimeline";
import { ThemeCluster } from "@/components/memory/ThemeCluster";
import { WeeklyReflection } from "@/components/memory/WeeklyReflection";
import { ResurfacedMemory } from "@/components/memory/ResurfacedMemory";
import { MemoryResonance } from "@/components/memory/MemoryResonance";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getStarterJourneyStatus } from "@/lib/ai/starter-journey";
import { StarterJourneyBanner } from "@/components/ai/StarterJourneyBanner";
import { checkAIAvailability } from "@/lib/ai/gemini";

export const metadata = {
  title: "Memory - YOHAKU",
};

export default async function MemoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 1. Fetch Timeline (no AI calls)
  const timeline = await buildMemoryTimeline(userId);

  // 2. Fetch PRE-GENERATED Weekly Reflection (not generated on demand)
  const weeklyReflection = await prisma.weeklyReflection.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch PRE-GENERATED Memory Snapshot
  const snapshot = await prisma.memorySnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const themes = snapshot?.themes ? (snapshot.themes as string[]) : [];

  // 4. Fetch Resurfaced Memory
  const recentResurfacing = await prisma.memoryResurfacing.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // 5. Check AI connection status
  const [hasAiConnection, starterJourney] = await Promise.all([
    checkAIAvailability(userId),
    getStarterJourneyStatus(userId),
  ]);

  const hasAiAccess = hasAiConnection || starterJourney.active;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-24">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-light tracking-widest text-black/90 dark:text-white/90">
          記憶の地層
        </h1>
        <p className="text-sm md:text-base text-black/50 dark:text-white/50 leading-relaxed font-light">
          過去の余白が、時間とともに静かに沈殿する空間。
        </p>
      </header>

      {/* Navigation to Quiet Return */}
      <nav className="flex flex-col sm:flex-row gap-3">
        <Link 
          href="/memory"
          className="flex-1 px-6 py-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-center"
        >
          <p className="text-xs font-light tracking-widest text-black/40 dark:text-white/40 uppercase">現在地</p>
          <p className="text-sm font-light text-black/70 dark:text-white/70 mt-1">記憶の積み重ね</p>
        </Link>
        <Link 
          href="/quiet-return"
          className="flex-1 px-6 py-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-center group"
        >
          <p className="text-xs font-light tracking-widest text-black/40 dark:text-white/40 uppercase group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">静かな戻り</p>
          <p className="text-sm font-light text-black/70 dark:text-white/70 mt-1 group-hover:text-black/80 dark:group-hover:text-white/80 transition-colors">遠い断片が戻ってくる</p>
        </Link>
      </nav>

      {/* AI未接続対応 */}
      {!hasAiAccess && (
        <section className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
          {starterJourney.active ? (
            <>
              <StarterJourneyBanner
                remainingHours={starterJourney.remainingHours}
                remainingMinutes={starterJourney.remainingMinutes}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </section>
      )}

      {/* Resurfaced Memory (Past connections) */}
      {recentResurfacing && (
        <ResurfacedMemory resurfacing={recentResurfacing} />
      )}

      {/* Weekly Reflection */}
      {weeklyReflection?.reflection ? (
        <WeeklyReflection reflection={weeklyReflection.reflection} />
      ) : (
        <section className="p-8 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-center space-y-3">
          <p className="text-sm text-black/40 dark:text-white/40 font-light">
            週の振り返りはまだ生成されていません
          </p>
          <p className="text-xs text-black/25 dark:text-white/25 leading-relaxed font-light">
            記録が積み重なると、
            <br />
            毎週の思考の流れが見えてきます。
          </p>
        </section>
      )}

      {/* Long-term Themes (Resonance + Theme Cluster) */}
      {themes.length > 0 && (
        <>
          {/* Resonance Section */}
          <MemoryResonance userId={userId} themes={themes} />

          {/* Theme Cluster */}
          <ThemeCluster themes={themes} />
        </>
      )}

      {/* Timeline Grouped by Month */}
      <MemoryTimeline timeline={timeline} />
    </div>
  );
}