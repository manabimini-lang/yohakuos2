"use client";

import { Sparkles } from "lucide-react";

interface ThemeClusterProps {
  themes: string[];
}

export function ThemeCluster({ themes }: ThemeClusterProps) {
  if (!themes || themes.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Sparkles className="w-4 h-4 opacity-70" />
        <span className="font-medium">最近のテーマ</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme, idx) => (
          <div
            key={idx}
            className="px-4 py-2 rounded-full border border-notion-border dark:border-border bg-white/50 dark:bg-card text-sm text-notion-text dark:text-gray-300 shadow-sm"
          >
            {theme}
          </div>
        ))}
      </div>
    </div>
  );
}
