"use client";

import { Card } from "@/components/ui/card";
import { Compass, ArrowRight } from "lucide-react";
import type { YuiPlanningSuggestion } from "@/app/ui/backend/yui/planning_service";

type YuiPlanningCardProps = {
  suggestions: YuiPlanningSuggestion[] | null;
  isLoading?: boolean;
};

function getPriorityColor(score: number): { badge: string; accent: string } {
  if (score >= 80) return { badge: "bg-rose-500/10 text-rose-700 border-rose-500/20", accent: "border-rose-500/30" };
  if (score >= 50) return { badge: "bg-amber-500/10 text-amber-700 border-amber-500/20", accent: "border-amber-500/30" };
  return { badge: "bg-slate-500/10 text-slate-600 border-slate-500/20", accent: "border-slate-500/30" };
}

export function YuiPlanningCard({ suggestions, isLoading }: YuiPlanningCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground border-primary/10 bg-background/80 animate-pulse">
        プランニング情報を読み込んでいます...
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Compass className="h-4 w-4" />
          Weekly Planning
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          今週の注力候補
        </span>
      </div>

      {/* Suggestion list */}
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((s, idx) => {
          const colors = getPriorityColor(s.priorityScore);
          return (
            <div
              key={s.thread}
              className={`rounded-2xl border bg-muted/20 p-4 space-y-3 hover:bg-muted/30 transition ${colors.accent}`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{s.thread}</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${colors.badge}`}
                >
                  優先度 {s.priorityScore}
                </span>
              </div>

              {/* Reason */}
              <div className="rounded-xl border border-border/40 bg-background/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  理由
                </p>
                <p className="text-xs text-foreground/90 leading-relaxed">{s.reason}</p>
              </div>

              {/* Suggested action */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                    次の一歩
                  </p>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    {s.suggestedAction}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
