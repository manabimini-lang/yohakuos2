"use client";

import { PhilosophyFragment } from "@/lib/life/life-themes-engine";

interface PhilosophyFragmentsSectionProps {
  fragments: PhilosophyFragment[];
}

/**
 * Display philosophy fragments that emerge from records
 * These are not AI-generated advice, but echoes of user's own thinking
 */
export function PhilosophyFragmentsSection({
  fragments,
}: PhilosophyFragmentsSectionProps) {
  if (fragments.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
          にじみ出ている価値観
        </h2>
        <p className="text-sm font-light text-black/50 dark:text-white/50">
          あなたの記録から、静かに浮かび上がった考え方
        </p>
      </div>

      <div className="space-y-4">
        {fragments.map((fragment, idx) => (
          <div
            key={idx}
            className="relative group cursor-default transition-all duration-500"
          >
            <div className="relative backdrop-blur-[0.5px] border border-black/4 dark:border-white/4 rounded-lg p-5 sm:p-6 overflow-hidden bg-white/30 dark:bg-black/15 hover:bg-white/40 dark:hover:bg-black/25 transition-all duration-300">
              
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-black/20 via-black/10 to-transparent dark:from-white/20 dark:via-white/10 dark:to-transparent group-hover:w-1 transition-all duration-300" />

              {/* Content */}
              <div className="pl-4 space-y-3">
                {/* Fragment text */}
                <p className="text-sm sm:text-base font-light text-black/70 dark:text-white/70 leading-relaxed italic">
                  「{fragment.content}」
                </p>

                {/* Source theme */}
                <div className="flex items-center justify-between text-xs font-light text-black/40 dark:text-white/40">
                  <span className="text-black/50 dark:text-white/50">
                    テーマ: {fragment.sourceTheme}
                  </span>
                  <span className="opacity-60">
                    {fragment.evidenceCount}つの記録から
                  </span>
                </div>

                {/* Subtle indicator */}
                <div className="flex items-center gap-2 text-xs font-light text-black/25 dark:text-white/25 pt-1">
                  <span className="inline-block w-0.5 h-0.5 rounded-full bg-black/25 dark:bg-white/25" />
                  <span>あなた自身の言葉から</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note about fragments */}
      <div className="pt-4 text-center">
        <p className="text-xs font-light text-black/30 dark:text-white/30 max-w-md mx-auto leading-relaxed">
          これらは、AIの解釈ではなく、
          あなたの記録そのものからにじみ出ている思考です。
        </p>
      </div>
    </section>
  );
}
