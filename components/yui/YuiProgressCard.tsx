"use client";

import { Card } from "@/components/ui/card";
import { YuiCardSkeleton } from "@/components/yui/YuiCardSkeleton";
import { BarChart3, Zap, Clock, CheckCircle2, Sparkles } from "lucide-react";
import type { YuiThreadProgress } from "@/app/ui/backend/yui/progress_service";

type YuiProgressCardProps = {
  threads: YuiThreadProgress[] | null;
  isLoading?: boolean;
};

const STATUS_CONFIG: Record<
  YuiThreadProgress["progressStatus"],
  { label: string; icon: typeof Zap; color: string; bg: string; border: string }
> = {
  new: {
    label: "NEW",
    icon: Sparkles,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  active: {
    label: "ACTIVE",
    icon: Zap,
    color: "text-emerald-700",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  stalled: {
    label: "STALLED",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  completed: {
    label: "COMPLETED",
    icon: CheckCircle2,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
};

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

function formatDate(isoStr: string | null): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function YuiProgressCard({ threads, isLoading }: YuiProgressCardProps) {
  if (isLoading) {
    return <YuiCardSkeleton lines={3} />;
  }

  if (!threads || threads.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BarChart3 className="h-4 w-4" />
          Progress Overview
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          進捗把握
        </span>
      </div>

      {/* Thread Progress Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {threads.slice(0, 5).map((tp) => {
          const config = STATUS_CONFIG[tp.progressStatus];
          const StatusIcon = config.icon;
          return (
            <div
              key={tp.thread}
              className={`rounded-2xl border p-4 space-y-3 transition hover:shadow-sm ${config.border} bg-muted/20`}
            >
              {/* Thread name + status badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{tp.thread}</span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border flex-shrink-0`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-background/80 border border-border/40 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">活動日数</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{tp.activeDays}日</p>
                </div>
                <div className="rounded-xl bg-background/80 border border-border/40 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">勢い</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{tp.momentumScore}</p>
                </div>
              </div>

              {/* Date info */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                <span>開始: {formatDate(tp.firstSeenAt)}</span>
                <span>最終: {formatRelativeDate(tp.lastSeenAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
