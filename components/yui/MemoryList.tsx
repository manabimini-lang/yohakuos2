"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { YuiMemory } from "@/app/ui/backend/yui/models";

type MemoryListProps = {
  memories: YuiMemory[];
  onRefresh?: () => void;
  title?: string;
  description?: string;
};

export function MemoryList({
  memories,
  onRefresh,
  title = "YUI の記憶",
  description = "YUI が覚えていることを、重要度の高い順に見せます。",
}: MemoryListProps) {
  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Memories</p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            更新
          </button>
        )}
      </div>

      {memories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          まだ記憶はありません。最初のメモを追加するとここに表示されます。
        </p>
      ) : (
        <div className="space-y-4">
          {memories.map((memory) => (
            <article key={memory.id} className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-medium">{memory.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(memory.created_at), "yyyy/MM/dd HH:mm")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-transparent bg-background text-xs text-muted-foreground">
                    importance {memory.importance}
                  </Badge>
                  <Badge className="border-transparent bg-background text-xs text-muted-foreground">
                    登録経路: {formatSource(memory.source_type)}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{memory.summary}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {memory.body}
              </p>
              {memory.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="yohaku-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatSource(sourceType: string) {
  if (sourceType === "manual") return "手動保存";
  if (sourceType === "yui_proposed") return "YUI提案";
  return sourceType;
}
