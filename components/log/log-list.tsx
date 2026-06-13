"use client";

import { PersonalLog } from "@/lib/utils/log-db";
import { useRouter } from "next/navigation";

type LogListProps = {
  logs: PersonalLog[];
};

function formatMood(mood: number) {
  const MOODS: Record<number, string> = {
    "-2": "😫",
    "-1": "🙁",
    "0": "😐",
    "1": "🙂",
    "2": "😁",
  };
  return MOODS[mood] || "😐";
}

export function LogList({ logs }: LogListProps) {
  const router = useRouter();

  const handleOrganize = (content: string) => {
    sessionStorage.setItem("yohaku_ai_target_log", content);
    router.push("/ai");
  };

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        まだログがありません。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {logs.map((log) => {
        const date = new Date(log.created_at);
        const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
        const timeString = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        
        // 先頭2行を取得
        const previewContent = log.content.split("\n").slice(0, 2).join("\n");
        const hasMore = log.content.split("\n").length > 2;

        return (
          <div key={log.id} className="group flex flex-col gap-2 border-b border-slate-100 pb-6 transition-opacity hover:opacity-100 opacity-90">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <time dateTime={date.toISOString()}>
                {dateString} {timeString}
              </time>
              <span title={`Mood: ${log.mood}`}>{formatMood(log.mood)}</span>
              {log.tags.length > 0 && (
                <div className="flex gap-2 text-muted-foreground">
                  {log.tags.map(tag => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOrganize(log.content)}
                  className="text-muted-foreground hover:text-slate-600 transition-colors"
                >
                  [ AIで整理 ]
                </button>
              </div>
            </div>
            
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {previewContent}
              {hasMore && <span className="text-muted-foreground ml-1">...</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
