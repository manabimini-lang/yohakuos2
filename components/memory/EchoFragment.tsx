"use client";

import { ReturningFragment } from "@/lib/memory/return-engine";

interface EchoFragmentProps {
  fragment: ReturningFragment;
  narrative: string;
}

export function EchoFragment({ fragment, narrative }: EchoFragmentProps) {
  const strengthPercent = Math.round(fragment.strength * 100);
  
  return (
    <div
      className="relative group cursor-default transition-all duration-700 ease-out"
      style={{
        opacity: fragment.quietness,
      }}
    >
      {/* Outer atmospheric container */}
      <div className="relative backdrop-blur-[1px] border border-black/5 dark:border-white/5 rounded-lg p-6 sm:p-8 overflow-hidden bg-white/50 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/40 transition-all duration-500">
        
        {/* Faint background pattern (echo effect) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-transparent dark:from-white/5" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Fragment content - the word itself */}
          <div className="space-y-2">
            <p className="text-xs font-light tracking-widest text-black/40 dark:text-white/40 uppercase">
              静かな戻り
            </p>
            <h3
              className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80 leading-relaxed"
              style={{
                opacity: 0.9,
              }}
            >
              「{fragment.content}」
            </h3>
          </div>

          {/* Narrative - the interpretation */}
          <p className="text-sm sm:text-base font-light text-black/60 dark:text-white/60 leading-relaxed italic py-3 border-l-2 border-black/10 dark:border-white/10 pl-4">
            {narrative}
          </p>

          {/* Timeline context */}
          <div className="space-y-2 pt-2">
            <div className="flex items-baseline justify-between text-xs font-light text-black/50 dark:text-white/50">
              <span>
                初来：{fragment.originalDate.toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>{Math.floor(fragment.daysSinceFading / 30)}ヶ月の沈黙</span>
            </div>

            {/* Strength indicator - how clearly it returns */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-light text-black/40 dark:text-white/40">
                <span>戻りの鮮明さ</span>
                <span>{strengthPercent}%</span>
              </div>
              <div className="h-px bg-black/10 dark:bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-black/20 to-black/5 dark:from-white/20 dark:to-white/5 transition-all duration-1000 ease-out"
                  style={{ width: `${strengthPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Echo indicator */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <p className="text-xs font-light text-black/30 dark:text-white/30 tracking-wider">
              ✦ 遠い時間から静かに戻っています
            </p>
          </div>
        </div>
      </div>

      {/* Fade effect for low-light viewing */}
      <div className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/2 dark:to-white/2" />
    </div>
  );
}
