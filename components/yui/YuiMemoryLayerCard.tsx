"use client";

import { Card } from "@/components/ui/card";
import { Brain, Activity, Clock, Calendar } from "lucide-react";
import type { YuiMemoryLayer } from "@/app/ui/backend/yui/memory_layer_service";

type YuiMemoryLayerCardProps = {
  data: YuiMemoryLayer | null;
  isLoading?: boolean;
};

export function YuiMemoryLayerCard({ data, isLoading }: YuiMemoryLayerCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground border-primary/10 bg-background/80 animate-pulse">
        記憶レイヤー情報を読み込んでいます...
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-6 md:p-7 space-y-6 border-primary/20 bg-background/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Brain className="h-4 w-4" />
          YUI Memory Layer
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Memory Threads
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* 1. Active Threads (継続案件) */}
        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Activity className="h-4 w-4 text-emerald-500" />
            Active Threads（継続案件）
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {data.activeThreads.map((thread, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                ● {thread}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Dormant Threads (停止テーマ) */}
        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Clock className="h-4 w-4 text-amber-500" />
            Dormant Threads（最近止まっているテーマ）
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {data.dormantThreads.map((thread, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-700"
              >
                14日〜更新なし: {thread}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Memory Timeline */}
      {data.timeline && data.timeline.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Memory Timeline（重要イベントの系譜）
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 pt-1">
            {data.timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-background p-3.5 space-y-1.5 shadow-2xs hover:bg-muted/30 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.timeLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.dateStr}</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground truncate">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
