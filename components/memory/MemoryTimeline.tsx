"use client";

import { TimelineMonth } from "@/lib/memory/timeline-builder";
import { ContentCard } from "@/components/capture/ContentCard";

interface MemoryTimelineProps {
  timeline: TimelineMonth[];
}

export function MemoryTimeline({ timeline }: MemoryTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-20 text-center text-black/30 dark:text-white/30 font-light">
        まだ記憶の地層はありません。
      </div>
    );
  }

  // Calculate age-based opacity for fade effect
  // Oldest items fade slightly, newest stay full opacity
  const getItemOpacity = (createdAt: Date, index: number, total: number) => {
    // Items older than 90 days start fading
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince < 30) return 1; // Recent: full opacity
    if (daysSince < 60) return 0.95;
    if (daysSince < 90) return 0.85;
    return Math.max(0.6, 0.85 - (daysSince - 90) * 0.002); // Gradual fade, minimum 60%
  };

  return (
    <div className="space-y-20">
      {timeline.map((monthData, idx) => (
        <div key={idx} className="relative pl-4 sm:pl-8">
          {/* Vertical Line for Timeline feel */}
          <div className="absolute left-0 top-2 bottom-0 w-px bg-black/8 dark:bg-white/8" />
          
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-light tracking-widest text-black/90 dark:text-white/90">
              {monthData.year}年{monthData.month}月
            </h2>
            {monthData.themes && monthData.themes.length > 0 && (
              <div className="flex gap-3 text-xs text-black/40 dark:text-white/40 mt-3 font-light">
                {monthData.themes.map((theme, i) => (
                  <span key={i} className="flex items-center gap-3">
                    {theme}
                    {i < monthData.themes.length - 1 && (
                      <span className="w-px h-3 bg-black/10 dark:bg-white/10" />
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthData.items.map((item) => {
              const opacity = getItemOpacity(item.createdAt, 0, monthData.items.length);
              return (
                <div
                  key={item.id}
                  style={{
                    opacity,
                    transition: "opacity 0.3s ease",
                  }}
                  className={opacity < 0.8 ? "blur-[0.5px]" : ""}
                  title={opacity < 0.8 ? "少し前の記録" : undefined}
                >
                  <ContentCard item={item} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
