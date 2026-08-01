"use client";

import { Card } from "@/components/ui/card";

type TimelineEntry = {
  time: string;
  title: string;
  detail?: string;
};

type Props = {
  entries: TimelineEntry[];
};

export function TimelineCard({ entries }: Props) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground">Timeline</p>
      <div className="mt-3 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ履歴はありません。</p>
        ) : (
          entries.slice(0, 5).map((entry) => (
            <div key={`${entry.time}-${entry.title}`} className="flex gap-3 rounded-xl border border-border bg-background px-3 py-2">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{entry.title}</p>
                  <span className="text-[11px] text-muted-foreground">{entry.time}</span>
                </div>
                {entry.detail ? <p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
