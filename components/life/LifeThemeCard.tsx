"use client";

import { LifeTheme } from "@/lib/life/life-themes-engine";

interface LifeThemeCardProps {
  theme: LifeTheme;
}

/**
 * Display a single life theme
 * Calm, non-judgmental presentation
 */
export function LifeThemeCard({ theme }: LifeThemeCardProps) {
  const monthsSince = Math.floor(
    (new Date().getTime() - theme.firstAppeared.getTime()) / 
    (30 * 24 * 60 * 60 * 1000)
  );

  const strengthPercent = Math.round(theme.strength * 100);

  return (
    <div className="group relative cursor-default transition-all duration-500">
      <div className="relative backdrop-blur-[0.5px] border border-black/5 dark:border-white/5 rounded-lg p-6 sm:p-7 overflow-hidden bg-white/50 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/40 transition-all duration-300">
        
        {/* Subtle accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

        {/* Content */}
        <div className="space-y-4">
          {/* Theme name */}
          <div>
            <h3 className="text-xl sm:text-2xl font-light tracking-wide text-black/80 dark:text-white/80">
              「{theme.name}」
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm font-light text-black/60 dark:text-white/60 leading-relaxed">
            {theme.description}
          </p>

          {/* Temporal context */}
          <div className="flex items-center justify-between text-xs font-light text-black/50 dark:text-white/50 pt-2">
            <span>
              {monthsSince}ヶ月前から続いている
            </span>
            <span>{theme.frequency}回の記録</span>
          </div>

          {/* Strength indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-light text-black/40 dark:text-white/40">
              <span>テーマの強さ</span>
              <span>{strengthPercent}%</span>
            </div>
            <div className="h-0.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-black/20 to-black/5 dark:from-white/20 dark:to-white/5 transition-all duration-700"
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>

          {/* Examples */}
          {theme.examples.length > 0 && (
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1">
              <p className="text-xs font-light text-black/40 dark:text-white/40 uppercase tracking-widest">
                記録例
              </p>
              <div className="space-y-1">
                {theme.examples.slice(0, 2).map((example, i) => (
                  <p
                    key={i}
                    className="text-xs font-light text-black/50 dark:text-white/50 italic truncate"
                  >
                    • {example}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover accent */}
      <div className="absolute -inset-0.5 rounded-lg border border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}
