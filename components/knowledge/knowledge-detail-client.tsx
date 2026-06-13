"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SharedKnowledge = {
  id: string;
  title: string;
  summary: string;
  tags: any;
  road: string;
  createdAt: string;
};

export function KnowledgeDetailClient({ id }: { id: string }) {
  const [knowledge, setKnowledge] = useState<SharedKnowledge | null>(null);
  const [related, setRelated] = useState<SharedKnowledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/knowledge/${id}`);
        if (res.ok) {
          const data = await res.json();
          setKnowledge(data.knowledge);
          setRelated(data.related);
        }
      } catch (e) {
        console.error("Failed to load knowledge detail", e);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-xs text-muted-foreground font-sans tracking-widest animate-pulse">
          静かに本を開いています...
        </p>
      </div>
    );
  }

  if (!knowledge) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center space-y-4">
        <p className="text-sm text-muted-foreground font-serif">お探しの実践は見つかりませんでした。</p>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>一覧に戻る</span>
        </Link>
      </div>
    );
  }

  const date = new Date(knowledge.createdAt);
  const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

  // Unpack tags
  let parsedTags: string[] = [];
  if (Array.isArray(knowledge.tags)) {
    parsedTags = knowledge.tags;
  } else if (typeof knowledge.tags === "string") {
    try {
      parsedTags = JSON.parse(knowledge.tags);
    } catch {
      parsedTags = [];
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-24 space-y-16">
      {/* Back Button */}
      <div>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>一覧に戻る</span>
        </Link>
      </div>

      {/* Main Content Article */}
      <article className="space-y-8 font-sans">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
            <span className="bg-slate-50 px-2.5 py-0.5 rounded-full text-[9px] tracking-wide text-muted-foreground font-medium">
              {knowledge.road}
            </span>
            <time dateTime={knowledge.createdAt}>{dateString}</time>
          </div>
          <h1 className="text-xl md:text-2xl font-medium tracking-normal text-foreground leading-snug">
            {knowledge.title}
          </h1>
        </div>

        <div className="text-sm text-slate-600 leading-relaxed md:leading-loose whitespace-pre-wrap font-sans font-light bg-slate-50/30 p-6 md:p-8 rounded-2xl border border-slate-50">
          {knowledge.summary}
        </div>

        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {parsedTags.map((tag: string, i: number) => (
              <span key={i} className="text-xs text-muted-foreground font-mono">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Separator */}
      <hr className="border-slate-100" />

      {/* Related Practices Section */}
      <div className="space-y-6">
        <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase font-mono">
          関連する小さな実践
        </h3>
        
        {related.length === 0 ? (
          <p className="text-xs text-muted-foreground font-serif italic">他に関連する実践はまだありません。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((item) => {
              const relDate = new Date(item.createdAt);
              const relDateString = `${relDate.getFullYear()}.${String(relDate.getMonth() + 1).padStart(2, "0")}`;
              
              return (
                <Link
                  key={item.id}
                  href={`/knowledge/${item.id}`}
                  className="group flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-white transition-all duration-300 hover:border-slate-200"
                >
                  <div className="space-y-2">
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {relDateString}
                    </span>
                    <h4 className="text-xs font-medium text-slate-700 leading-snug group-hover:text-foreground transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                  <span className="mt-4 text-[9px] text-muted-foreground bg-slate-50 px-2 py-0.5 rounded-md self-start font-medium font-sans">
                    {item.road.replace("ロード", "")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
