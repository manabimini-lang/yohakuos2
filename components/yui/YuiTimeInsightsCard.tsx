"use client";

import { Card } from "@/components/ui/card";
import { YuiCardSkeleton } from "@/components/yui/YuiCardSkeleton";
import { Clock, Timer, BarChart2 } from "lucide-react";
import type { YuiTimeIntelligence } from "@/app/ui/backend/yui/time_intelligence_service";
import { getCategoryLabel } from "@/components/yui/utils/time-labels";

type YuiTimeInsightsCardProps = {
  data: YuiTimeIntelligence | null;
  isLoading?: boolean;
};

const CATEGORY_COLORS: Record<string, { bar: string; text: string }> = {
  meeting: { bar: "bg-violet-500", text: "text-violet-700" },
  focus: { bar: "bg-emerald-500", text: "text-emerald-700" },
  learning: { bar: "bg-blue-500", text: "text-blue-700" },
  family: { bar: "bg-rose-400", text: "text-rose-700" },
  health: { bar: "bg-amber-500", text: "text-amber-700" },
  other: { bar: "bg-slate-400", text: "text-slate-600" },
};

function formatHour(hour: number | null): string {
  if (hour === null) return "—";
  return `${String(hour).padStart(2, "0")}:00`;
}

export function YuiTimeInsightsCard({ data, isLoading }: YuiTimeInsightsCardProps) {
  if (isLoading) {
    return <YuiCardSkeleton lines={3} />;
  }

  if (!data || (data.topCategories.length === 0 && data.totalScheduledHours === 0)) {
    return null;
  }

  const maxPercentage = Math.max(...data.topCategories.map((c) => c.percentage), 1);

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Clock className="h-4 w-4" />
          Time Insights
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          過去14日
        </span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-muted/20 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Timer className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">予定総時間</p>
            <p className="text-lg font-bold text-foreground">{data.totalScheduledHours}h</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
            <BarChart2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">集中しやすい時間</p>
            <p className="text-lg font-bold text-foreground">{formatHour(data.peakFocusHour)}</p>
          </div>
        </div>
      </div>

      {/* Category bars */}
      {data.topCategories.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            カテゴリ別時間配分
          </p>
          {data.topCategories.map((cat) => {
            const colors = CATEGORY_COLORS[cat.category] ?? CATEGORY_COLORS.other;
            const barWidth = Math.max((cat.percentage / maxPercentage) * 100, 4);
            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${colors.text}`}>
                    {getCategoryLabel(cat.category)}
                  </span>
                  <span className="text-muted-foreground">
                    {cat.totalHours}h ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
