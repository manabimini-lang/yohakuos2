import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { QuietAudioPlayer } from "@/components/audio/QuietAudioPlayer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface ReflectionDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ReflectionDetailPage({ params }: ReflectionDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const reflection = await prisma.audioReflection.findUnique({
    where: { id: params.id },
  });

  if (!reflection || reflection.userId !== session.user.id) {
    notFound();
  }

  // Fetch related content item if it exists
  const contentItem = reflection.contentItemId
    ? await prisma.contentItem.findUnique({
        where: { id: reflection.contentItemId },
        select: {
          id: true,
          title: true,
          aiTags: true,
          summary: true,
        },
      })
    : null;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0A0A] text-black/80 dark:text-foreground/80 pb-32 selection:bg-black/10 dark:selection:bg-white/10">
      <main className="max-w-2xl mx-auto px-6 pt-24 md:pt-32 space-y-8">
        
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/reflections"
            className="inline-flex items-center text-xs text-black/40 dark:text-foreground/40 hover:text-black/60 dark:hover:text-foreground/60 transition-colors group"
          >
            <ChevronLeft className="w-3 h-3 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            振り返りに戻る
          </Link>
          <div className="text-xs font-mono text-black/40 dark:text-foreground/40">
            {new Date(reflection.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </div>
        </div>

        {/* Script section */}
        <section className="space-y-6 pt-8 border-t border-black/5 dark:border-border/50">
          <h1 className="text-lg md:text-xl font-light tracking-wider text-black/90 dark:text-foreground/90">
            静かな振り返り
          </h1>
          
          <p className="text-base leading-relaxed font-light text-black/70 dark:text-foreground/70 whitespace-pre-wrap">
            {reflection.script}
          </p>
        </section>

        {/* Audio player section */}
        {reflection.status === "completed" && reflection.audioUrl && (
          <section className="space-y-6 pt-8 border-t border-black/5 dark:border-border/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-foreground/40">
                  音声
                </h2>
                {reflection.duration && (
                  <span className="text-xs text-black/30 dark:text-foreground/30">
                    {Math.round(reflection.duration / 60)}分
                  </span>
                )}
              </div>
              <QuietAudioPlayer
                src={reflection.audioUrl}
                title="静かな振り返り"
              />
            </div>
          </section>
        )}

        {reflection.status === "pending" && (
          <section className="space-y-6 pt-8 border-t border-black/5 dark:border-border/50">
            <p className="text-sm text-black/40 dark:text-foreground/40 italic font-light">
              音声を生成しています...
            </p>
          </section>
        )}

        {reflection.status === "failed" && (
          <section className="space-y-6 pt-8 border-t border-black/5 dark:border-border/50">
            <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-card border border-black/5 dark:border-border/50 text-center">
              <p className="text-sm text-black/40 dark:text-foreground/40 font-light">
                音声の生成に失敗しました。
              </p>
            </div>
          </section>
        )}

        {/* Related content section */}
        {contentItem && (
          <section className="space-y-6 pt-8 border-t border-black/5 dark:border-border/50">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-foreground/40">
              この振り返りのもとになった記録
            </h2>
            
            <Link
              href={`/inbox/${contentItem.id}`}
              className="block p-6 rounded-2xl border border-black/10 dark:border-border bg-black/[0.02] dark:bg-card hover:border-black/20 dark:hover:border-white/20 transition-colors group"
            >
              <h3 className="font-light text-black/90 dark:text-foreground/90 group-hover:text-black dark:group-hover:text-foreground transition-colors mb-3">
                {contentItem.title || "No title"}
              </h3>
              
              {contentItem.summary && (
                <p className="text-sm text-black/60 dark:text-foreground/60 line-clamp-2 font-light mb-3">
                  {contentItem.summary}
                </p>
              )}
              
              {contentItem.aiTags && contentItem.aiTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contentItem.aiTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-3 py-1 rounded-full text-xs bg-black/5 dark:bg-card text-black/60 dark:text-foreground/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </section>
        )}

        {/* Theme/tags section */}
        {contentItem?.aiTags && contentItem.aiTags.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-black/5 dark:border-border/50">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-foreground/40">
              関連テーマ
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {contentItem.aiTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-block px-4 py-2 rounded-2xl text-sm font-light bg-black/[0.04] dark:bg-white/[0.04] text-black/70 dark:text-foreground/70 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
