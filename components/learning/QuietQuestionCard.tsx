"use client";

import Link from "next/link";
import { LearningSuggestion } from "@prisma/client";
import { ChevronRight, Sparkles } from "lucide-react";

interface QuietQuestionItemProps {
  suggestion: LearningSuggestion & {
    contentItem?: { id: string; title?: string; url?: string; fileName?: string } | null;
    knowledgeContent?: { id: string; title?: string } | null;
  };
}

export function QuietQuestionCard({ suggestion }: QuietQuestionItemProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-950/50 dark:to-slate-900/30 p-8 hover:border-slate-300/60 dark:hover:border-slate-700/60 transition-all duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            静かな問い
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <p className="text-lg leading-relaxed font-light text-slate-800 dark:text-slate-100">
          {suggestion.reason || "記録同士のつながりが見えてきました。"}
        </p>

        {/* Similarity indicator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-300/50 to-transparent dark:from-slate-600/50"></div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {(suggestion.similarityScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Related Content Links */}
      {(suggestion.contentItem || suggestion.knowledgeContent) && (
        <div className="space-y-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">関連する記録</p>
          <div className="flex flex-col gap-2">
            {suggestion.contentItem && (
              <Link
                href={`/inbox/${suggestion.contentItem.id}`}
                className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {suggestion.contentItem.title || suggestion.contentItem.fileName || "記録"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            {suggestion.knowledgeContent && (
              <Link
                href={`/knowledge/${suggestion.knowledgeContent.id}`}
                className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {suggestion.knowledgeContent.title || "知識"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
