import { InteractionTracker } from "@/components/capture/InteractionTracker";
import { ExternalLink } from "@/components/capture/ExternalLink";
import { RelatedMemoryCard } from "@/components/memory/RelatedMemoryCard";
import { getRelatedMemories } from "@/lib/memory/related-memory";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

export const dynamic = "force-dynamic";

function classifyAiError(lastError: string | null): { message: string; subMessage: string; showSettings: boolean } {
  const calmDefault = {
    message: "AIは今夜、静かに休んでいます。",
    subMessage: "整理を完了できませんでした。後ほど再試行されます。",
    showSettings: true,
  };
  
  if (!lastError) return calmDefault;

  const errStr = lastError.toLowerCase();

  // API Key Invalid
  if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("key not valid") || errStr.includes("unauthorized") || errStr.includes("auth")) {
    return {
      message: "AIは今夜、静かに休んでいます。",
      subMessage: "接続情報を確認してください。",
      showSettings: true,
    };
  }

  // Rate Limit / Quota
  if (errStr.includes("exhausted") || errStr.includes("quota") || errStr.includes("limit") || errStr.includes("429")) {
    return {
      message: "AIは今夜、静かに休んでいます。",
      subMessage: "現在AI利用上限に達しています。しばらく時間を空けて再試行されます。",
      showSettings: false,
    };
  }

  // Network Error
  if (errStr.includes("fetch") || errStr.includes("network") || errStr.includes("dns") || errStr.includes("timeout") || errStr.includes("connect") || errStr.includes("econnrefused")) {
    return {
      message: "AIは今夜、静かに休んでいます。",
      subMessage: "一時的な接続の問題が発生しました。",
      showSettings: false,
    };
  }

  return calmDefault;
}

export default async function InboxDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const item = await prisma.contentItem.findUnique({
    where: { id: params.id },
    select: CONTENT_ITEM_SAFE_SELECT,
  });

  if (!item || item.userId !== session.user.id) {
    redirect("/inbox");
  }

  // Find the latest content_analysis job for this item to extract any lastError
  let lastError: string | null = null;
  const lastJob = await prisma.aIJob.findFirst({
    where: {
      userId: session.user.id,
      jobType: "content_analysis",
      input: { path: ["contentItemId"], equals: item.id },
    },
    orderBy: { createdAt: "desc" },
  });
  if (lastJob) {
    lastError = lastJob.lastError;
  }

  const errorDetails = classifyAiError(lastError);

  const relatedItems = await getRelatedMemories(item.id, session.user.id);

  const isPdf = item.type === "pdf";
  const originalLink = item.url || item.fileUrl;
  const displayTitle = item.title || item.fileName || "保存された記録";
  const sourceLabel = isPdf ? "PDF" : item.domain || "外部リンク";
  const savedAt = new Date(item.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <InteractionTracker itemId={item.id} type="view" />
      <div className="max-w-4xl mx-auto px-6 pt-14 pb-24 space-y-10">
        <section className="space-y-4">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">余白の詳細</div>
          <h1 className="text-3xl font-light leading-tight text-foreground">{displayTitle}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{savedAt}</span>
            <span className="rounded-full border border-border bg-card px-3 py-1">{sourceLabel}</span>
          </div>

          {item.aiTags && item.aiTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.aiTags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">内容の要約</div>
          {lastError ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-sm leading-relaxed text-muted-foreground">{errorDetails.message}</p>
              <p className="text-xs leading-relaxed text-muted-foreground font-light leading-relaxed">
                {errorDetails.subMessage}
              </p>
              <div className="flex gap-4 pt-1">
                {errorDetails.showSettings && (
                  <Link
                    href="/yui/settings"
                    className="inline-flex items-center text-xs font-light text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    AI設定を確認する
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link
                  href={`/inbox/${item.id}/retry`}
                  className="inline-flex items-center text-xs font-light text-muted-foreground hover:text-foreground transition-colors group"
                >
                  もう一度試す
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ) : !item.summary || item.meaningStatus === "pending" || item.meaningStatus === "processing" ? (
            <p className="text-sm leading-relaxed text-muted-foreground animate-pulse">静かに意味を整理しています...</p>
          ) : null}

          {item.summary ? (
            <p className="text-base leading-relaxed text-foreground">{item.summary}</p>
          ) : null}
        </section>

        {item.reflection ? (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">なぜ残したのか</div>
            <p className="text-sm leading-relaxed text-foreground">{item.reflection}</p>
          </section>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">この記録に近い余白</div>
            <p className="text-[11px] text-muted-foreground font-light">以前のあなたが近いテーマで残していた記録です</p>
          </div>

          {relatedItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {relatedItems.map((related) => (
                <RelatedMemoryCard key={related.id} item={related} />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm font-light text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
              まだ近い余白は見つかっていません
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">元の記事を開く</div>
          {originalLink ? (
            <div className="flex flex-wrap gap-3">
              <ExternalLink
                href={originalLink}
                itemId={item.id}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/10"
              >
                続きを読む
              </ExternalLink>
              {isPdf && item.fileUrl ? (
                <ExternalLink
                  href={item.fileUrl}
                  itemId={item.id}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/10"
                >
                  別タブで開く
                </ExternalLink>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">この記録には外部リンクが含まれていません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
