"use client";

import { Card } from "@/components/ui/card";

type Props = {
  updates: string[];
  updatedAt?: number | null;
  title?: string;
};

export function UpdatesCard({ updates, updatedAt, title = "Updates" }: Props) {
  const visibleUpdates = updates.slice(0, 3);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <h3 className="text-lg font-bold">{visibleUpdates.length}件の変化</h3>
        </div>
        <span className="text-xs text-muted-foreground">{updatedAt ? `更新 ${new Date(updatedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}` : "未取得"}</span>
      </div>
      {visibleUpdates.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">昨日から変化はありません。</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-foreground/90">
          {visibleUpdates.map((item) => (
            <li key={item} className="rounded-xl border border-border bg-background px-3 py-2 leading-6">
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
