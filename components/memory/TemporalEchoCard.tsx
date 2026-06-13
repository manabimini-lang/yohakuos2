"use client";

import { TemporalEcho } from "@/lib/memory/return-engine";

interface TemporalEchoCardProps {
  echo: TemporalEcho;
}

export function TemporalEchoCard({ echo }: TemporalEchoCardProps) {
  const months = Math.floor(echo.gapDays / 30);
  
  return (
    <div className="relative group cursor-default transition-all duration-700">
      {/* Atmospheric container */}
      <div className="relative backdrop-blur-[0.5px] border border-black/4 dark:border-white/4 rounded-lg p-5 sm:p-6 overflow-hidden bg-white/25 dark:bg-black/15 hover:bg-white/35 dark:hover:bg-black/25 transition-all duration-500">
        
        {/* Subtle echo effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 dark:from-white/5 dark:to-white/5" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-3">
          {/* Echo marker */}
          <p className="text-xs font-light tracking-widest text-black/25 dark:text-foreground/25 uppercase">
            時間の響き
          </p>

          {/* Two timestamps with echo visual */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-xs font-light text-black/50 dark:text-foreground/50">
                {echo.firstAppearance.toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                <span className="text-xs text-black/30 dark:text-foreground/30">✦</span>
                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              </div>
              <div className="text-xs font-light text-black/50 dark:text-foreground/50">
                {echo.lastAppearance.toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Gap duration */}
            <p className="text-xs font-light text-black/40 dark:text-foreground/40 text-center py-1">
              {months}ヶ月の間隔で「{echo.fragmentContent}」が静かに響いています
            </p>
          </div>

          {/* Echo intensity visualization */}
          <div className="space-y-1 pt-2">
            <div className="h-0.5 bg-black/5 dark:bg-card rounded-full overflow-hidden">
              <div
                className="h-full bg-black/15 dark:bg-white/15 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(echo.echoIntensity * 100)}%` }}
              />
            </div>
          </div>

          {/* Echo sentiment */}
          <p className="text-xs font-light text-black/30 dark:text-foreground/30 italic pt-1">
            存在は直線ではありません
          </p>
        </div>
      </div>
    </div>
  );
}
