"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Youtube, 
  FileText, 
  MessageSquare, 
  Smartphone, 
  ExternalLink,
  ChevronLeft,
  Loader2
} from "lucide-react";

type ExternalContent = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  road: string;
  tags: any;
  description: string | null;
  createdAt: string;
};

type SharedKnowledge = {
  id: string;
  title: string;
  summary: string;
  tags: any;
  road: string;
  createdAt: string;
};

const ROAD_METADATA: Record<string, { title: string; dbRoad: string; desc: string }> = {
  beginner: {
    title: "初任者ロード",
    dbRoad: "初任者ロード",
    desc: "教育現場の新しい一歩。目の前の子供たちと向き合いながら、自分のための余白も見つけていく導線。"
  },
  sidejob: {
    title: "副業ロード",
    dbRoad: "副業ロード",
    desc: "新しい可能性への挑戦。本業とのバランスを保ちながら、少しずつ自立の種を育てていく導線。"
  },
  retirement: {
    title: "退職ロード",
    dbRoad: "退職ロード",
    desc: "次のステップへ向けた整理。これまでの歩みを振り返り、穏やかに次の扉を開くための導線。"
  }
};

export function RoadClient({ roadKey }: { roadKey: string }) {
  const meta = ROAD_METADATA[roadKey];

  const [externalContents, setExternalContents] = useState<ExternalContent[]>([]);
  const [sharedKnowledges, setSharedKnowledges] = useState<SharedKnowledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) return;

    async function loadRoadData() {
      setLoading(true);
      try {
        // Fetch external contents for this road
        const extRes = await fetch(`/api/external-contents/list?road=${encodeURIComponent(meta.dbRoad)}`);
        const extData = extRes.ok ? await extRes.json() : [];
        setExternalContents(extData);

        // Fetch shared knowledge for this road
        const kRes = await fetch(`/api/knowledge/list?road=${encodeURIComponent(meta.dbRoad)}`);
        const kData = kRes.ok ? await kRes.json() : [];
        setSharedKnowledges(kData);
      } catch (error) {
        console.error("Failed to load road data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRoadData();
  }, [roadKey, meta]);

  if (!meta) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-lg font-medium text-foreground">ロードが見つかりませんでした</h1>
        <Link href="/dashboard" className="mt-4 inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" />
          ダッシュボードへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-24 space-y-16 selection:bg-slate-100">
      {/* Top Navigation */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-xs text-muted-foreground hover:text-slate-600 transition-colors font-mono"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Dashboard
        </Link>
      </div>

      {/* Header / Top Section */}
      <div className="space-y-4">
        <div className="h-[1px] w-8 bg-slate-200"></div>
        <h1 className="text-2xl font-serif text-slate-850 tracking-wide">{meta.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed font-sans max-w-lg">
          {meta.desc}
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-350">
          <Loader2 className="w-6 h-6 animate-spin mb-2 stroke-[1.5]" />
          <span className="text-xs font-mono">Loading resources...</span>
        </div>
      ) : (
        <>
          {/* Central Section: Recommended Contents */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">おすすめのインプット</h2>
              <p className="text-[10px] text-muted-foreground font-sans">このロードに適した、note・YouTube・外部記事などのリンク集</p>
            </div>

            {externalContents.length === 0 ? (
              <p className="text-xs text-muted-foreground font-serif italic py-4">現在おすすめされている外部コンテンツはありません。</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {externalContents.map((item) => {
                  let parsedTags: string[] = [];
                  if (Array.isArray(item.tags)) {
                    parsedTags = item.tags;
                  } else if (typeof item.tags === "string") {
                    try {
                      parsedTags = JSON.parse(item.tags);
                    } catch {
                      parsedTags = [];
                    }
                  }

                  const Icon = item.type === "youtube" ? Youtube 
                             : item.type === "note" ? BookOpen 
                             : item.type === "discord" ? MessageSquare 
                             : item.type === "app" ? Smartphone 
                             : FileText;

                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-2xl border border-slate-100 bg-white overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-slate-200"
                    >
                      <div className="space-y-3">
                        {/* Thumbnail / Placeholder */}
                        {item.thumbnailUrl ? (
                          <div className="relative w-full h-28 bg-slate-50 overflow-hidden border-b border-slate-50">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover saturate-50 contrast-95 brightness-95 group-hover:saturate-100 group-hover:scale-[1.02] transition-all duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-20 bg-slate-50/70 border-b border-slate-50 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-350 stroke-[1.5]" />
                          </div>
                        )}

                        <div className="px-5 pb-4 space-y-2">
                          <span className="text-[9px] font-medium tracking-wider text-muted-foreground bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-flex items-center space-x-1">
                            <Icon className="w-3 h-3 stroke-[2] text-muted-foreground" />
                            <span>
                              {item.type === "youtube" ? "YouTube" 
                               : item.type === "note" ? "note" 
                               : item.type === "discord" ? "Discord" 
                               : item.type === "app" ? "ツール" 
                               : "外部記事"}
                            </span>
                          </span>

                          <h3 className="text-xs font-semibold text-foreground leading-snug group-hover:text-foreground transition-colors line-clamp-2 inline-flex items-center gap-1">
                            <span>{item.title}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-muted-foreground transition-colors shrink-0" />
                          </h3>

                          {item.description && (
                            <p className="text-[11px] text-slate-550 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {parsedTags.length > 0 && (
                        <div className="px-5 pb-4 flex flex-wrap gap-1">
                          {parsedTags.map((tag, i) => (
                            <span key={i} className="text-[9px] text-muted-foreground font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Section: Related Shared Knowledge */}
          <div className="space-y-6 pt-8 border-t border-slate-100">
            <div className="space-y-1">
              <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">関連する小さな実践</h2>
              <p className="text-[10px] text-muted-foreground font-sans">このロードを歩む他のメンバーの実践知見</p>
            </div>

            {sharedKnowledges.length === 0 ? (
              <p className="text-xs text-muted-foreground font-serif italic py-4">現在このロードに関する知見はまだ共有されていません。</p>
            ) : (
              <div className="space-y-4">
                {sharedKnowledges.map((knowledge) => {
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
                    <Link
                      key={knowledge.id}
                      href={`/knowledge/${knowledge.id}`}
                      className="group block rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:border-slate-200"
                    >
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-foreground leading-snug group-hover:text-foreground transition-colors">
                          {knowledge.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {knowledge.summary}
                        </p>
                        {parsedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {parsedTags.map((tag, i) => (
                              <span key={i} className="text-[9px] text-slate-450 font-mono">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
