"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import sanitizeHtml from "sanitize-html";
import { ChevronDown, ChevronUp } from "lucide-react";

const MOOD_TAG_CONFIG: Record<string, { label: string; color: string }> = {
  "疲れた":       { label: "疲れた",       color: "bg-slate-100 text-muted-foreground" },
  "焦る":         { label: "焦る",         color: "bg-slate-100 text-muted-foreground" },
  "不安":         { label: "不安",         color: "bg-slate-100 text-muted-foreground" },
  "整えたい":     { label: "整えたい",     color: "bg-slate-100 text-muted-foreground" },
  "少し前進したい": { label: "少し前進したい", color: "bg-slate-100 text-muted-foreground" },
};

interface Log {
  id: string;
  inputText: string;
  aiResponse: string | null;
  smallAction: string | null;
  moodTag: string | null;
  createdAt: Date;
}

export function HistoryLogCard({ log }: { log: Log }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const dateFmt = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const moodConfig = log.moodTag ? (MOOD_TAG_CONFIG[log.moodTag] ?? { label: log.moodTag, color: "bg-slate-100 text-muted-foreground" }) : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* ヘッダー（常時表示） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
        aria-expanded={isExpanded}
        aria-label={`${dateFmt.format(log.createdAt)}の記録を${isExpanded ? "閉じる" : "開く"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            {/* 日付 + moodTag */}
            <div className="flex items-center gap-2 flex-wrap">
              <time
                dateTime={log.createdAt.toISOString()}
                className="text-xs text-muted-foreground"
              >
                {dateFmt.format(log.createdAt)}　{timeFmt.format(log.createdAt)}
              </time>
              {moodConfig && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${moodConfig.color}`}>
                  {moodConfig.label}
                </span>
              )}
            </div>
            {/* 入力内容（2行まで） */}
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
              {log.inputText}
            </p>
          </div>
          <span className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>

        {/* 小さな一歩（常時表示） */}
        {log.smallAction && (
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {log.smallAction}
            </p>
          </div>
        )}
      </button>

      {/* 展開コンテンツ（AI応答全文） */}
      {isExpanded && log.aiResponse && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5 animate-in fade-in duration-200">
          {/* 書いたこと */}
          <div className="mb-5 space-y-2">
            <p className="text-xs text-muted-foreground tracking-wide">書いたこと</p>
            <p className="text-sm text-slate-700 leading-loose whitespace-pre-wrap">
              {log.inputText}
            </p>
          </div>

          {/* 区切り */}
          <div className="w-8 h-px bg-slate-200 mb-5" />

          {/* AI整理内容 */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground tracking-wide">整理</p>
            <div className="prose prose-sm prose-slate max-w-none
              prose-headings:font-medium prose-headings:text-slate-600 prose-headings:text-xs
              prose-headings:uppercase prose-headings:tracking-wide
              prose-headings:mt-5 prose-headings:mb-2
              first:prose-headings:mt-0
              prose-p:text-slate-600 prose-p:leading-loose prose-p:text-sm
              prose-p:my-2">
              <ReactMarkdown>{sanitizeHtml(log.aiResponse)}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
