import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { YuiActionSuggestion } from "@/app/ui/backend/yui/action_service";

interface Props {
  actions: YuiActionSuggestion[];
}

function getActionTypeBadge(type: YuiActionSuggestion["actionType"]) {
  switch (type) {
    case "goal":
      return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Goal</Badge>;
    case "reflection":
      return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Reflection</Badge>;
    case "calendar":
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Calendar</Badge>;
    case "timeblock":
      return <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">Timeblock</Badge>;
    default:
      return null;
  }
}

export function YuiActionCard({ actions }: Props) {
  if (!actions || actions.length === 0) return null;

  // Sort by priorityScore descending and take top 5
  const sorted = [...actions]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return (
    <Card className="p-6 md:p-7 space-y-5 border-primary/20 bg-background/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <span>Action Suggestions</span>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          今週の提案
        </span>
      </div>
      <div className="space-y-3">
        {sorted.map((a, idx) => (
          <div
            key={a.id}
            className="rounded-2xl border bg-muted/20 p-4 space-y-3 hover:bg-muted/30 transition"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{a.title}</span>
              </div>
              <div className="flex items-center gap-1">
                {getActionTypeBadge(a.actionType)}
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                >
                  優先度 {a.priorityScore}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                理由
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">{a.reason}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
              <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                  説明
                </p>
                <p className="text-xs font-medium text-foreground leading-relaxed">{a.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
