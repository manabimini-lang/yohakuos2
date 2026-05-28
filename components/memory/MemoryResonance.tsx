"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MemoryResonanceProps {
  userId: string;
  themes: string[];
}

interface ResonanceConnection {
  theme1: string;
  theme2: string;
  connection: string;
  strength: number; // 0-1
}

export function MemoryResonance({ userId, themes }: MemoryResonanceProps) {
  const [resonances, setResonances] = useState<ResonanceConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (themes.length < 2) {
      setLoading(false);
      return;
    }

    // Simulate resonance detection based on themes
    // In production, this would come from a server action or API call
    const detected: ResonanceConnection[] = [];

    // Simple heuristic: themes that appear close together in time
    // For now, just show a few example connections
    if (themes.length >= 2) {
      detected.push({
        theme1: themes[0],
        theme2: themes[1],
        connection: `最近、「${themes[0]}」と「${themes[1]}」の記録が近づいています。`,
        strength: 0.7,
      });
    }

    if (themes.length >= 3) {
      detected.push({
        theme1: themes[1],
        theme2: themes[2],
        connection: `「${themes[1]}」と「${themes[2]}」の記録が、同じ期間に増えているようです。`,
        strength: 0.5,
      });
    }

    setResonances(detected);
    setLoading(false);
  }, [themes]);

  if (loading || resonances.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8">
      <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
        静かにつながっていること
      </h2>

      <div className="space-y-6">
        {resonances.map((resonance, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl border border-black/8 dark:border-white/8 bg-gradient-to-br from-black/[0.02] to-black/[0.01] dark:from-white/[0.02] dark:to-white/[0.01] hover:border-black/15 dark:hover:border-white/15 transition-colors"
          >
            {/* Connection Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-light text-black/70 dark:text-white/70 truncate">
                  {resonance.theme1}
                </span>
                <div className="flex-shrink-0 text-black/20 dark:text-white/20">↔</div>
                <span className="text-sm font-light text-black/70 dark:text-white/70 truncate">
                  {resonance.theme2}
                </span>
              </div>
              <div
                className="flex-shrink-0 text-xs font-mono text-black/30 dark:text-white/30"
                title={`接続度: ${Math.round(resonance.strength * 100)}%`}
              >
                {Math.round(resonance.strength * 100)}%
              </div>
            </div>

            {/* Connection Text */}
            <p className="text-sm leading-relaxed font-light text-black/60 dark:text-white/60">
              {resonance.connection}
            </p>

            {/* Strength Indicator */}
            <div className="mt-4 h-0.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-black/20 dark:bg-white/20 transition-all duration-300"
                style={{ width: `${resonance.strength * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {resonances.length > 0 && (
        <Link
          href="/memory/resonance"
          className="inline-flex items-center text-xs font-light text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors group"
        >
          その他のつながりを見る
          <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </section>
  );
}
