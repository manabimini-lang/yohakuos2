"use client";

import { Card } from "@/components/ui/card";
import { YuiCardSkeleton } from "@/components/yui/YuiCardSkeleton";
import { BookOpen, CheckCircle2, Activity, Clock, Target, ArrowRight } from "lucide-react";
import type { YuiWeeklyReview } from "@/app/ui/backend/yui/weekly_review_service";

type YuiWeeklyReviewCardProps = {
  review: YuiWeeklyReview | null;
  isLoading?: boolean;
};

export function YuiWeeklyReviewCard({ review, isLoading }: YuiWeeklyReviewCardProps) {
  if (isLoading) {
    return <YuiCardSkeleton lines={3} />;
  }

  if (!review) {
    return null;
  }

  const hasContent =
    review.achievements.length > 0 ||
    review.activeThreads.length > 0 ||
    review.stalledThreads.length > 0 ||
    review.nextWeekFocus.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BookOpen className="h-4 w-4" />
          Weekly Review
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          今週の振り返り
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Achievements */}
        {review.achievements.length > 0 && (
          <div className="space-y-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              今週の成果
            </div>
            <ul className="space-y-1.5">
              {review.achievements.map((a, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90 leading-relaxed">
                  <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Active Threads */}
        {review.activeThreads.length > 0 && (
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              継続中テーマ
            </div>
            <div className="flex flex-wrap gap-1.5">
              {review.activeThreads.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                >
                  ● {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stalled Threads */}
        {review.stalledThreads.length > 0 && (
          <div className="space-y-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Clock className="h-4 w-4" />
              停滞テーマ
            </div>
            <div className="flex flex-wrap gap-1.5">
              {review.stalledThreads.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-700"
                >
                  ● {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Time Summary */}
        {review.timeSummary && (
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              時間の使い方
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">{review.timeSummary}</p>
          </div>
        )}
      </div>

      {/* Next Week Focus */}
      {review.nextWeekFocus.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Target className="h-4 w-4" />
            来週の重点テーマ
          </div>
          <div className="space-y-1.5">
            {review.nextWeekFocus.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground leading-relaxed">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary flex-shrink-0">
                  {idx + 1}
                </span>
                <ArrowRight className="h-3 w-3 text-primary/60 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
