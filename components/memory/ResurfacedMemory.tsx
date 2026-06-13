"use client";

import { Leaf } from "lucide-react";
import { MemoryResurfacing } from "@prisma/client";

interface ResurfacedMemoryProps {
  resurfacing: MemoryResurfacing | null;
}

export function ResurfacedMemory({ resurfacing }: ResurfacedMemoryProps) {
  if (!resurfacing) return null;

  return (
    <div className="mb-12 p-6 rounded-2xl bg-brand/5 dark:bg-brand/10 border border-brand/10 dark:border-brand/20">
      <div className="flex items-center gap-2 mb-3 text-sm text-brand/70 dark:text-brand/80">
        <Leaf className="w-4 h-4 opacity-70" />
        <span className="font-medium">静かなつながり</span>
      </div>
      <p className="text-base text-notion-text dark:text-foreground leading-relaxed font-serif">
        {resurfacing.message}
      </p>
    </div>
  );
}
