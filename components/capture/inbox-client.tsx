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
