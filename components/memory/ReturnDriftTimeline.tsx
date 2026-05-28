"use client";

import { ReturningFragment, CalmResurfacing } from "@/lib/memory/return-engine";

interface ReturnDriftTimelineProps {
  fragments: ReturningFragment[];
  resurfacings: CalmResurfacing[];
}

/**
 * Non-linear timeline of quiet returns
 * Not a chronicle, but a drift of resurfacing silence
 */
export function ReturnDriftTimeline({
  fragments,
  resurfacings,
}: ReturnDriftTimelineProps) {
  if (fragments.length === 0 && resurfacings.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center space-y-4">
        <p className="text-sm font-light text-black/40 dark:text-white/40">
          遠い断片が戻ってくるのを待っています
        </p>
        <p className="text-xs font-light text-black/25 dark:text-white/25">
          存在は、単なる積み重ねではなく、
          <br />
          静かな往来を繰り返しています
        </p>
      </div>
    );
  }

  // Combine and sort by recency of appearance
  interface TimelineEvent {
    type: "fragment" | "resurfacing";
    content: string;
    originalDate: Date;
    silenceLength?: number;
    daysSinceFading?: number;
    data: ReturningFragment | CalmResurfacing;
  }

  const events: TimelineEvent[] = [];

  fragments.forEach((f) => {
    events.push({
      type: "fragment",
      content: f.content,
      originalDate: f.originalDate,
      daysSinceFading: f.daysSinceFading,
      data: f,
    });
  });

  resurfacings.forEach((r) => {
    events.push({
      type: "resurfacing",
      content: r.content,
      originalDate: r.fadedAt,
      silenceLength: r.silenceLength,
      data: r,
    });
  });

  // Sort by silence length (longest silence first)
  events.sort((a, b) => {
    const silenceA = a.daysSinceFading || a.silenceLength || 0;
    const silenceB = b.daysSinceFading || b.silenceLength || 0;
    return silenceB - silenceA;
  });

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Header */}
      <div className="mb-12 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/70 dark:text-white/70">
          戻りの流れ
        </h2>
        <p className="text-sm font-light text-black/50 dark:text-white/50 max-w-lg leading-relaxed">
          時間は直線ではなく、
          遠い断片や薄れていた余白は、
          少し違う静けさで、また戻ってくることがある。
        </p>
      </div>

      {/* Timeline events */}
      <div className="relative space-y-8">
        {/* Vertical guide line */}
        <div className="absolute left-0 sm:left-4 top-0 bottom-0 w-px bg-gradient-to-b from-black/10 via-black/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />

        {events.map((event, idx) => {
          const isFragment = event.type === "fragment";
          const fragment = event.data as ReturningFragment;
          const silence = event.daysSinceFading || event.silenceLength || 0;
          const months = Math.floor(silence / 30);

          return (
            <div
              key={idx}
              className="relative pl-8 sm:pl-12 group transition-all duration-500 opacity-90 hover:opacity-100"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 sm:left-2 top-1.5 w-2 h-2 rounded-full bg-black/20 dark:bg-white/20 group-hover:bg-black/40 dark:group-hover:bg-white/40 transition-all duration-300" />

              {/* Content card */}
              <div className="relative backdrop-blur-[0.5px] border border-black/3 dark:border-white/3 rounded-lg p-4 sm:p-5 bg-white/20 dark:bg-black/10 hover:bg-white/30 dark:hover:bg-black/15 transition-all duration-300">
                
                {/* Content */}
                <div className="space-y-2">
                  {/* Type indicator */}
                  <p className="text-xs font-light tracking-widest text-black/30 dark:text-white/30 uppercase">
                    {isFragment ? "静かな戻り" : "穏やかな再浮上"}
                  </p>

                  {/* Fragment/Theme content */}
                  <h4 className="text-lg sm:text-xl font-light text-black/70 dark:text-white/70">
                    「{event.content}」
                  </h4>

                  {/* Silence length */}
                  <p className="text-sm font-light text-black/50 dark:text-white/50">
                    {months}ヶ月の沈黙を越えて
                  </p>

                  {/* Narrative note */}
                  {isFragment && (
                    <p className="text-xs font-light italic text-black/40 dark:text-white/40 pt-2 border-l-2 border-black/5 dark:border-white/5 pl-3">
                      以前({fragment.originalDate.toLocaleDateString("ja-JP")})のいのちが、別の形で戻っています。
                    </p>
                  )}
                </div>

                {/* Hover indicator */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-black/10 dark:bg-white/10 group-hover:h-8 group-hover:bg-black/20 dark:group-hover:bg-white/20 transition-all duration-300 rounded-full" />
              </div>
            </div>
          );
        })}

        {/* End sentinel */}
        <div className="relative pl-8 sm:pl-12 opacity-50">
          <div className="absolute left-0 sm:left-2 top-1.5 w-2 h-2 rounded-full bg-black/10 dark:bg-white/10" />
          <p className="text-xs font-light text-black/30 dark:text-white/30 italic">
            さらに遠い時間へ...
          </p>
        </div>
      </div>

      {/* Bottom philosophy note */}
      <div className="mt-16 pt-12 border-t border-black/5 dark:border-white/5 text-center">
        <p className="text-xs font-light text-black/25 dark:text-white/25 leading-relaxed max-w-md mx-auto">
          戻ることにも、静かな流れがある。
          <br />
          存在は消えてはいない。
          <br />
          ただ、異なる場所で眠っているだけ。
        </p>
      </div>
    </div>
  );
}
