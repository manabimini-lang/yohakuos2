"use client";

import { useState } from "react";
import { ContentItem } from "@prisma/client";
import { MemoryCard } from "@/components/memory/memory-card";
import { EmptyInbox } from "@/components/capture/EmptyInbox";

interface InboxClientProps {
  recentItems: ContentItem[];
  contextItems: ContentItem[];
}

export function InboxClient({ recentItems, contextItems }: InboxClientProps) {
  const [tab, setTab] = useState<"recent" | "context">("recent");

  const items = tab === "recent" ? recentItems : contextItems;

  return (
    <div className="space-y-8">
      {recentItems.length < 20 && (
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">AIの整理を使えるようにする</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                まずは20件を目安に記録してください。5件で最近のテーマ、20件でより詳しい振り返りが表示されます。
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">{recentItems.length}/20</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (recentItems.length / 20) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          onClick={() => setTab("recent")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            tab === "recent"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Recent
          <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{recentItems.length}</span>
          {tab === "recent" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setTab("context")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            tab === "context"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Context
          <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{contextItems.length}</span>
          {tab === "context" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MemoryCard key={item.id} memory={item} />
          ))}
        </div>
      ) : (
        <EmptyInbox />
      )}
    </div>
  );
}
