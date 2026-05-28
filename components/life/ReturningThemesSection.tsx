"use client";

import { ReturningTheme } from "@/lib/life/life-themes-engine";

interface ReturningThemesSectionProps {
  themes: ReturningTheme[];
}

/**
 * Display themes that keep returning
 * These are patterns in life, not goals
 */
export function ReturningThemesSection({ themes }: ReturningThemesSectionProps) {
  if (themes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
          何度も戻ってくること
        </h2>
        <p className="text-sm font-light text-black/50 dark:text-white/50">
          人生テーマは、直線ではなく、何度も戻ってくる。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((theme, idx) => (
          <div
            key={idx}
            className="group relative cursor-default transition-all duration-500"
          >
            <div className="relative backdrop-blur-[0.5px] border border-black/4 dark:border-white/4 rounded-lg p-5 sm:p-6 overflow-hidden bg-white/40 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/30 transition-all duration-300">
              
              {/* Subtle top line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5" />

              {/* Content */}
              <div className="space-y-4">
                {/* Theme name */}
                <h3 className="text-lg sm:text-xl font-light tracking-wide text-black/75 dark:text-white/75">
                  「{theme.name}」
                </h3>

                {/* Return cycles */}
                <div className="space-y-2">
                  <p className="text-sm font-light text-black/60 dark:text-white/60">
                    {theme.cycleCount}度の異なる時期に現れています
                  </p>
                  <p className="text-xs font-light text-black/50 dark:text-white/50">
                    {theme.firstAppeared.toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "short",
                    })}{" "}
                    →{" "}
                    {theme.lastAppeared.toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>

                {/* Cycle visualization */}
                <div className="flex items-center gap-1 pt-2">
                  {Array.from({ length: Math.min(theme.cycleCount, 6) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-black/20 dark:bg-white/20"
                      />
                    )
                  )}
                  {theme.cycleCount > 6 && (
                    <span className="text-xs text-black/30 dark:text-white/30 ml-1">
                      +{theme.cycleCount - 6}
                    </span>
                  )}
                </div>

                {/* Philosophy hint */}
                {theme.philosophy && (
                  <p className="text-xs font-light italic text-black/45 dark:text-white/45 pt-2 border-t border-black/5 dark:border-white/5">
                    {theme.philosophy}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
