"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { YuiNotificationPreview } from "@/app/ui/backend/yui/models";

export function YuiNotificationPreviewCard() {
  const [previews, setPreviews] = useState<{
    morning: YuiNotificationPreview;
    evening: YuiNotificationPreview;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreviews() {
      try {
        const response = await fetch("/api/yui/notifications/preview");
        if (!response.ok) {
          throw new Error("通知プレビューの取得に失敗しました");
        }
        const data = await response.json();
        setPreviews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "通知プレビューの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchPreviews();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        通知プレビューを生成しています...
      </Card>
    );
  }

  if (error || !previews) {
    return (
      <Card className="p-6 text-sm text-amber-800 border-amber-200 bg-amber-50">
        {error ?? "プレビューを読み込めませんでした"}
      </Card>
    );
  }

  return (
    <Card className="space-y-6 p-6">
      <div className="space-y-2 border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight">Notification Preview</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          YUIから配信予定の通知メッセージのイメージです。
        </p>
      </div>

      <div className="space-y-6">
        {/* Morning Brief Preview */}
        <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Morning Brief Preview
              </span>
              <span className="text-sm font-semibold text-foreground">
                {previews.morning.title}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(previews.morning.generatedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 pl-1">
            {previews.morning.message}
          </div>
        </div>

        {/* Evening Reflection Preview */}
        <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                Evening Reflection Preview
              </span>
              <span className="text-sm font-semibold text-foreground">
                {previews.evening.title}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(previews.evening.generatedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 pl-1">
            {previews.evening.message}
          </div>
        </div>
      </div>
    </Card>
  );
}
