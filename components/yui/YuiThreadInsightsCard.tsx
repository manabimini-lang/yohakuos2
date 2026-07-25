"use client";

import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, ArrowRight, Target } from "lucide-react";
import type { YuiThreadInsight } from "@/app/ui/backend/yui/thread_intelligence_service";

type YuiThreadInsightsCardProps = {
  threads: YuiThreadInsight[] | null;
  isLoading?: boolean;
};

function getPriorityLabel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 80) {
    return {
      label: "高",
      color: "text-rose-700",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    };
  }
  if (score >= 50) {
    return {
      label: "中",
      color: "text-amber-700",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  }
  return {
    label: "低",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  };
}

function formatRelativeDate(isoStr: string | null): string {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  if (days <= 7) return `${days}日前`;
  if (days <= 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export function YuiThreadInsightsCard({ threads, isLoading }: YuiThreadInsightsCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground border-primary/10 bg-background/80 animate-pulse">
        スレッドインサイトを読み込んでいます...
      </Card>
    );
  }

  if (!threads || threads.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Lightbulb className="h-4 w-4" />
          Thread Intelligence
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          文脈分析
        </span>
      </div>

      {/* Thread Cards */}
      <div className="space-y-3">
        {threads.slice(0, 5).map((insight) => {
          const priority = getPriorityLabel(insight.priorityScore);
          return (
            <div
              key={insight.thread}
              className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3 hover:bg-muted/30 transition"
            >
              {/* Thread header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary/70" />
                  <span className="text-sm font-semibold text-foreground">{insight.thread}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${priority.bg} ${priority.color} ${priority.border}`}
                  >
                    重要度 {insight.priorityScore} ({priority.label})
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>出現 {insight.frequency}回</span>
                <span className="hidden sm:inline">·</span>
                <span>最終更新: {formatRelativeDate(insight.lastSeenAt)}</span>
              </div>

              {/* Related info */}
              {(insight.relatedGoals.length > 0 || insight.relatedCalendarEvents.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {insight.relatedGoals.map((goal, idx) => (
                    <span
                      key={`goal-${idx}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700"
                    >
                      <Target className="h-3 w-3" />
                      {goal}
                    </span>
                  ))}
                  {insight.relatedCalendarEvents.map((ev, idx) => (
                    <span
                      key={`cal-${idx}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-medium text-blue-700"
                    >
                      📅 {ev}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Next Step */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                    次の一歩
                  </p>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    {insight.suggestedNextStep}
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
