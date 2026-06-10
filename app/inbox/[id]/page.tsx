import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

  const relatedFilters: any[] = [];
  if (item.aiTags && item.aiTags.length > 0) {
    relatedFilters.push({ aiTags: { hasSome: item.aiTags } });
  }
  if (item.contentType) {
    relatedFilters.push({ contentType: item.contentType });
  }

  const relatedItems =
    relatedFilters.length > 0
      ? await prisma.contentItem.findMany({
          where: {
            userId: session.user.id,
            id: { not: item.id },
            OR: relatedFilters,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        })
      : [];

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
    <main className="min-h-screen bg-[#090909] pb-28 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 pt-14 pb-28 space-y-10">
        <section className="space-y-4">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500">余白の詳細</div>
          <h1 className="text-3xl font-light leading-tight text-white">{displayTitle}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{savedAt}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{sourceLabel}</span>
          </div>

          {item.aiTags && item.aiTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.aiTags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          {lastError ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-sm leading-relaxed text-slate-300">{errorDetails.message}</p>
              <p className="text-xs leading-relaxed text-slate-500 font-light leading-relaxed">
                {errorDetails.subMessage}
              </p>
              <div className="flex gap-4 pt-1">
                {errorDetails.showSettings && (
                  <Link
                    href="/settings/ai"
                    className="inline-flex items-center text-xs font-light text-slate-400 hover:text-slate-200 transition-colors group"
                  >
                    AI設定を確認する
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link
                  href={`/inbox/${item.id}/retry`}
                  className="inline-flex items-center text-xs font-light text-slate-400 hover:text-slate-200 transition-colors group"
                >
                  もう一度試す
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ) : !item.summary ? (
            <p className="text-sm leading-relaxed text-slate-400">まだ静かに整理されています。</p>
          ) : null}

          {item.summary ? (
            <p className="text-base leading-relaxed text-slate-100">{item.summary}</p>
          ) : null}
        </section>

        {item.reflection ? (
          <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-500">なぜ残したかったか</div>
            <p className="text-sm leading-relaxed text-slate-200">{item.reflection}</p>
          </section>
        ) : null}

        {relatedItems.length > 0 ? (
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-500">関連する余白</div>
            <div className="grid grid-cols-1 gap-3">
              {relatedItems.map((related) => (
                <Link
                  key={related.id}
                  href={`/inbox/${related.id}`}
                  className="rounded-3xl border border-white/10 bg-[#0B0B0B] px-4 py-3 text-sm text-slate-200 transition-colors hover:border-white/15"
                >
                  <div className="line-clamp-2">{related.title || related.fileName || related.url}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {related.aiTags && related.aiTags.length > 0 ? related.aiTags.slice(0, 2).join(" • ") : related.contentType || "記録"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500">元の記事を開く</div>
          {originalLink ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={originalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-white/10"
              >
                続きを読む
              </a>
              {isPdf && item.fileUrl ? (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-white/10"
                >
                  別タブで開く
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">この記録には外部リンクが含まれていません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
