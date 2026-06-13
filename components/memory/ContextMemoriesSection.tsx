"use client";

import type { RelatedMemoryViewModel } from "@/lib/memory/related-memory";
import { RelatedMemoryCard } from "./RelatedMemoryCard";

export function ContextMemoriesSection({ memories }: { memories: RelatedMemoryViewModel[] }) {
  if (memories.length === 0) {
    return null; // Empty state for memories is omitted if there are none, as the ContextProfile handles the empty state message.
  }

  return (
    <section className="mb-14 space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">最近のあなたに近い余白</div>
        <p className="text-[11px] text-muted-foreground font-light">今の関心と近いテーマの記録です</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {memories.map((memory) => (
          <RelatedMemoryCard key={memory.id} item={memory} />
        ))}
      </div>
    </section>
  );
}
