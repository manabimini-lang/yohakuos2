import { ContentItem } from "@prisma/client";
import { FileText, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { RelatedContent } from "./RelatedContent";

export function ContentCard({ item }: { item: ContentItem }) {
  const isUrl = item.type === "url";
  const date = new Date(item.createdAt).toLocaleDateString("ja-JP");

  return (
    <a
      href={item.url || item.fileUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block group bg-white dark:bg-[#111111] rounded-2xl border border-notion-border dark:border-white/10 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 flex flex-col h-full"
    >
      {isUrl ? (
        <div className="aspect-[1.91/1] w-full bg-gray-50 dark:bg-white/5 relative overflow-hidden border-b border-notion-border dark:border-white/10 shrink-0">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title || ""}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600">
              <LinkIcon className="w-8 h-8" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[1.91/1] w-full bg-gray-50 dark:bg-white/5 relative flex items-center justify-center border-b border-notion-border dark:border-white/10 transition-colors group-hover:bg-brand/5 shrink-0">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-brand" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-notion-text dark:text-white line-clamp-2 leading-tight">
            {item.title || item.url || item.fileName}
          </h3>
          {/* AI Status Indicator */}
          {item.aiStatus === "pending" && (
            <div className="flex items-center text-gray-400 shrink-0" title="AIが静かに整理しています">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          )}
        </div>

        {/* AI Summary (if available) */}
        {item.summary && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-grow">
            {item.summary}
          </p>
        )}

        {/* User Reflection (if available) */}
        {item.reflection && (
          <div className="mb-3 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
            <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">
              "{item.reflection}"
            </p>
          </div>
        )}

        <div className="mt-auto">
          {/* AI Tags */}
          {item.aiTags && item.aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.aiTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand/5 dark:bg-brand/10 text-[10px] text-brand/70 dark:text-brand/80"
                >
                  <Sparkles className="w-2.5 h-2.5 opacity-50" />
                  {tag}
                </span>
              ))}
              {item.aiTags.length > 3 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-[10px] text-gray-400">
                  +{item.aiTags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="truncate pr-2">
              {isUrl ? item.domain : item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : "PDF"}
              {item.contentType && ` • ${item.contentType}`}
            </span>
            <span className="shrink-0">{date}</span>
          </div>

          <RelatedContent contentItemId={item.id} />
        </div>
      </div>
    </a>
  );
}
