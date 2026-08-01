"use client";

import { Card } from "@/components/ui/card";

export function YuiCardSkeleton({
  lines = 3,
  compact = false,
}: {
  lines?: number;
  compact?: boolean;
}) {
  return (
    <Card className={`animate-pulse border-primary/10 bg-background/80 ${compact ? "p-4" : "p-6"}`}>
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}
