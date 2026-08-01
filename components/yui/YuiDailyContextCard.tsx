"use client";

import { Card } from "@/components/ui/card";
import { YuiCardSkeleton } from "@/components/yui/YuiCardSkeleton";
import { History, Tag, ArrowRight } from "lucide-react";
import type { YuiDailyContext } from "@/app/ui/backend/yui/daily_context_service";

type YuiDailyContextCardProps = {
  data: YuiDailyContext | null;
  isLoading?: boolean;
};

export function YuiDailyContextCard({ data, isLoading }: YuiDailyContextCardProps) {
  if (isLoading) {
    return <YuiCardSkeleton lines={3} />;
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <History className="h-4 w-4" />
          昨日から続いていること
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Continuity Context
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          {data.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {data.summary}
        </p>
      </div>

      {data.memorySignals && data.memorySignals.length > 0 && (
        <div className="pt-3 border-t border-border/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Tag className="h-3.5 w-3.5 text-primary/70" />
            最近よく扱っているテーマ
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {data.memorySignals.map((signal, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-xl bg-muted/60 border border-border/60 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition cursor-default"
              >
                #{signal}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
