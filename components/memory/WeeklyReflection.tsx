"use client";

import { BookOpen } from "lucide-react";

interface WeeklyReflectionProps {
  reflection: string | null;
}

export function WeeklyReflection({ reflection }: WeeklyReflectionProps) {
  if (!reflection) return null;

  return (
    <div className="mb-12 p-6 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
        <BookOpen className="w-4 h-4 opacity-70" />
        <span className="font-medium">今週の余白</span>
      </div>
      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-serif italic">
        {reflection}
      </p>
    </div>
  );
}
