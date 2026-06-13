"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

type SharedKnowledge = {
  id: string;
  title: string;
  summary: string;
  tags: any;
  road: string;
  createdAt: string;
};

export function KnowledgeClient() {
  const [knowledges, setKnowledges] = useState<SharedKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoad, setSelectedRoad] = useState<string>("all");

  useEffect(() => {
    async function fetchKnowledge() {
      setLoading(true);
      try {
        const url = selectedRoad === "all" 
          ? "/api/knowledge/list" 
          : `/api/knowledge/list?road=${encodeURIComponent(selectedRoad)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setKnowledges(data);
        }
      } catch (e) {
        console.error("Failed to load knowledge", e);
      } finally {
        setLoading(false);
      }
    }

    fetchKnowledge();
  }, [selectedRoad]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-24 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left">
        <h1 className="text-xl font-medium tracking-wide text-foreground">小さな実践</h1>
        <p className="text-sm text-muted-foreground leading-relaxed font-sans">
          みんなの実践から、少しずつ学ぶ
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start border-b border-slate-50 pb-4">
        {[
          { id: "all", label: "すべて" },
          { id: "初任者ロード", label: "初任者" },
          { id: "副業ロード", label: "副業" },
          { id: "退職ロード", label: "退職" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSelectedRoad(btn.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              selectedRoad === btn.id
                ? "bg-slate-900 text-foreground"
                : "bg-slate-50 text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground font-sans tracking-widest animate-pulse">図書を整理しています...</p>
          </div>
        ) : knowledges.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
            <p className="text-sm text-muted-foreground font-serif">まだここにおかれた実践はありません。</p>
          </div>
        ) : (
          <div className="space-y-8">
            {knowledges.map((item) => {
              const date = new Date(item.createdAt);
              const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
              
              // Safely unpack tags
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

              return (
                <Link
                  key={item.id}
                  href={`/knowledge/${item.id}`}
                  className="block group"
                >
                  <article
                    className="flex flex-col justify-between p-6 rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-slate-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span className="bg-slate-50 px-2.5 py-0.5 rounded-full text-[9px] tracking-wide text-muted-foreground font-medium">
                          {item.road}
                        </span>
                        <time dateTime={item.createdAt}>{dateString}</time>
                      </div>
                      <h2 className="text-base font-medium text-foreground leading-snug group-hover:text-foreground transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed font-sans whitespace-pre-wrap">
                        {item.summary}
                      </p>
                    </div>
                    
                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-50">
                        {parsedTags.map((tag: string, i: number) => (
                          <span key={i} className="text-[10px] text-muted-foreground font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
