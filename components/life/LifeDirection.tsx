"use client";

interface LifeDirectionProps {
  direction: string;
  themes?: string[];
}

/**
 * Display detected life direction
 * Calm observation, not prescription
 */
export function LifeDirection({ direction, themes = [] }: LifeDirectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80">
          最近、静かに続いていること
        </h2>

        {/* Main direction message */}
        <div className="relative backdrop-blur-[0.5px] border border-black/5 dark:border-white/5 rounded-lg p-8 overflow-hidden bg-white/50 dark:bg-black/30">
          
          {/* Subtle background accent */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-transparent dark:from-white/5" />
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-4">
            <p className="text-base sm:text-lg font-light leading-relaxed text-black/75 dark:text-white/75">
              {direction}
            </p>

            {/* Theme indicators */}
            {themes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {themes.slice(0, 4).map((theme, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/2 text-xs font-light text-black/60 dark:text-white/60"
                  >
                    {theme}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
        </div>

        {/* Philosophical note */}
        <p className="text-sm font-light text-black/50 dark:text-white/50 leading-relaxed border-l-2 border-black/10 dark:border-white/10 pl-4">
          人生の方向性は、目標ではなく、流れです。
          <br />
          あなたの記録から、その流れが静かに見えてきています。
        </p>
      </div>
    </section>
  );
}
