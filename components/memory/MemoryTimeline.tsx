"use client";

import { TimelineMonth } from "@/lib/memory/timeline-builder";
import { ContentCard } from "@/components/capture/ContentCard";

interface MemoryTimelineProps {
  timeline: TimelineMonth[];
}

export function MemoryTimeline({ timeline }: MemoryTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        まだ記憶の地層はありません。
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {timeline.map((monthData, idx) => (
        <div key={idx} className="relative pl-4 sm:pl-8">
          {/* Vertical Line for Timeline feel */}
          <div className="absolute left-0 top-2 bottom-0 w-px bg-gray-200 dark:bg-white/10" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-serif text-notion-text dark:text-white mb-2">
              {monthData.year}年{monthData.month}月
            </h2>
            {monthData.themes && monthData.themes.length > 0 && (
              <div className="flex gap-2 text-sm text-gray-500">
                {monthData.themes.map((theme, i) => (
                  <span key={i}>
                    {theme}
                    {i < monthData.themes.length - 1 && <span className="mx-2 opacity-30">•</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthData.items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
