"use client";

import { useEffect, useState } from "react";
import { getRelatedContent } from "@/app/actions/related-content";
import { ContentItem } from "@prisma/client";
import { Link2 } from "lucide-react";

interface RelatedContentProps {
  contentItemId: string;
}

export function RelatedContent({ contentItemId }: RelatedContentProps) {
  const [relatedItems, setRelatedItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRelated = async () => {
      setIsLoading(true);
      try {
        const items = await getRelatedContent(contentItemId);
        if (isMounted) {
          setRelatedItems(items);
        }
      } catch (error) {
        console.error("Failed to fetch related items:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [contentItemId]);

  if (isLoading || relatedItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-notion-border dark:border-white/10">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500">
        <Link2 className="w-3.5 h-3.5" />
        <span>過去の文脈</span>
      </div>
      <div className="flex flex-col gap-2">
        {relatedItems.map((item) => (
          <a
            key={item.id}
            href={item.url || item.fileUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-2 py-1.5 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-xs text-gray-600 dark:text-gray-400"
          >
            <span className="truncate group-hover:text-notion-text dark:group-hover:text-white transition-colors">
              {item.title || item.fileName || item.url}
            </span>
            <span className="shrink-0 text-gray-400 dark:text-gray-600 pl-2">
              {new Date(item.createdAt).toLocaleDateString("ja-JP")}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
