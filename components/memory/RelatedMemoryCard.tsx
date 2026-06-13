"use client";

import Link from "next/link";
import { trackRelatedMemoryClick } from "@/app/actions/memory-interaction";
import type { RelatedMemoryViewModel } from "@/lib/memory/related-memory";

export function RelatedMemoryCard({ item }: { item: RelatedMemoryViewModel }) {
  const handleClick = () => {
    trackRelatedMemoryClick(item.id).catch(console.error);
  };

  return (
    <Link
      href={`/inbox/${item.id}`}
      onClick={handleClick}
      className="group flex flex-col md:flex-row gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-white/15 hover:bg-[#111111]"
    >
      {/* Thumbnail */}
      {item.thumbnailUrl ? (
        <div className="relative h-24 w-full md:w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative flex h-24 w-full md:w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">記憶</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="text-sm font-light leading-snug text-foreground line-clamp-2 mb-2">
          {item.title}
        </h3>
        
        {item.reflectionPreview ? (
          <p className="text-xs leading-relaxed text-muted-foreground font-light line-clamp-2">
            {item.reflectionPreview}
          </p>
        ) : (
          <p className="text-xs text-slate-600 font-light italic">
            静かな記録
          </p>
        )}
      </div>
    </Link>
  );
}
