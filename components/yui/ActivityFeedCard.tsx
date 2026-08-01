"use client";

import { Card } from "@/components/ui/card";

type ActivityItem = {
  time: string;
  title: string;
  detail?: string;
};

type Props = {
  items: ActivityItem[];
};

export function ActivityFeedCard({ items }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Activity</p>
          <h3 className="text-lg font-bold">YUI Feed</h3>
        </div>
        <span className="text-xs text-muted-foreground">{items.length}件</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">直近の変化はまだありません。</p>
        ) : (
          items.slice(0, 6).map((item, index) => (
            <div key={`${item.time}-${item.title}-${index}`} className="rounded-2xl border border-border bg-background px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-[11px] text-muted-foreground">{item.time}</span>
              </div>
              {item.detail ? <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p> : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
