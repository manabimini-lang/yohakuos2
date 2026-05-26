"use client";

import { Link2 } from "lucide-react";
import { ContentItem } from "@prisma/client";

interface MemoryConnectionProps {
  relatedItems: ContentItem[];
}

export function MemoryConnection({ relatedItems }: MemoryConnectionProps) {
  if (!relatedItems || relatedItems.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-notion-border dark:border-white/10">
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Link2 className="w-4 h-4 opacity-70" />
        <span className="font-medium">つながっている余白</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedItems.map((item) => (
          <a
            key={item.id}
            href={item.url || item.fileUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl bg-white dark:bg-[#111111] border border-notion-border dark:border-white/10 hover:shadow-sm transition-all"
          >
            <h4 className="text-sm font-medium text-notion-text dark:text-white line-clamp-2 mb-2">
              {item.title || item.fileName || item.url}
            </h4>
            <div className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleDateString("ja-JP")}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
