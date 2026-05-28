"use client";

import { CalmResurfacing } from "@/lib/memory/return-engine";

interface CalmResurfacingCardProps {
  resurfacing: CalmResurfacing;
}

export function CalmResurfacingCard({ resurfacing }: CalmResurfacingCardProps) {
  const months = Math.floor(resurfacing.silenceLength / 30);
  
  return (
    <div className="relative group cursor-default transition-all duration-700">
      {/* Subtle background */}
      <div className="relative backdrop-blur-[0.5px] border border-black/3 dark:border-white/3 rounded-lg p-6 sm:p-7 overflow-hidden bg-white/30 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/30 transition-all duration-500">
        
        {/* Gentle gradient overlay (ascending) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent dark:from-white/5" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Resurfacing header */}
          <div className="space-y-2">
            <p className="text-xs font-light tracking-widest text-black/30 dark:text-white/30 uppercase">
              穏やかな再浮上
            </p>
            <h4 className="text-xl sm:text-2xl font-light tracking-wide text-black/70 dark:text-white/70">
              「{resurfacing.content}」
            </h4>
          </div>

          {/* Silence narrative */}
          <div className="space-y-2">
            <p className="text-sm font-light text-black/50 dark:text-white/50 leading-relaxed">
              {months}ヶ月の静寂を越えて
            </p>
            <p className="text-sm italic font-light text-black/60 dark:text-white/60 border-l-2 border-black/5 dark:border-white/5 pl-3 py-2">
              {resurfacing.resurfaceAtmosphere}
            </p>
          </div>

          {/* Timeline visualization */}
          <div className="py-4 space-y-2">
            <div className="h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-transparent via-black/15 to-transparent dark:via-white/15"
                style={{
                  animation: "breath 4s ease-in-out infinite",
                  opacity: 0.6,
                }}
              />
            </div>
            <p className="text-xs font-light text-black/35 dark:text-white/35 text-center">
              {resurfacing.fadedAt.toLocaleDateString("ja-JP")} → {resurfacing.resurfacedAt.toLocaleDateString("ja-JP")}
            </p>
          </div>

          {/* Echo marker */}
          <div className="flex items-center gap-2 text-xs font-light text-black/25 dark:text-white/25">
            <span className="inline-block w-1 h-1 rounded-full bg-black/25 dark:bg-white/25" />
            <span>静かに戻ってきています</span>
          </div>
        </div>
      </div>

      {/* Breathing style animation */}
      <style>{`
        @keyframes breath {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
