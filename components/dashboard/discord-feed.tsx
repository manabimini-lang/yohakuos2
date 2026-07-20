"use client";

import { useEffect, useState } from "react";
import { Body, Caption, SectionTitle } from "@/components/ui/typography";

type DiscordPost = {
  id: string;
  author: string;
  content: string;
  created_at: string;
};

export function DiscordFeed() {
  const [discordFeed, setDiscordFeed] = useState<DiscordPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFeed = async () => {
      try {
        const res = await fetch("/api/discord/feed");
        if (res.ok) {
          const feedData = await res.json();
          if (isMounted) {
            setDiscordFeed(feedData.slice(0, 5));
          }
        }
      } catch (error) {
        console.error("Failed to load Discord feed:", error);
      } finally {
        if (isMounted) setLoadingFeed(false);
      }
    };

    fetchFeed();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
      <div>
        <Caption>Discord Feed</Caption>
        <SectionTitle className="mt-1">Express</SectionTitle>
        <Body className="mt-1 text-muted-foreground/80">
          同じ空間で静かに共有されている実践の声。
        </Body>
      </div>

      {loadingFeed ? (
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground font-mono tracking-widest animate-pulse">
            声を整理しています...
          </p>
        </div>
      ) : discordFeed.length === 0 ? (
        <p className="text-sm text-muted-foreground/80">
          共有されている声はまだありません。
        </p>
      ) : (
        <div className="space-y-4">
          {discordFeed.map((post) => {
            // Strip standard emojis and limit length
            const cleanedContent = post.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu, '');
            const truncatedContent = cleanedContent.length > 80 ? cleanedContent.substring(0, 80) + "..." : cleanedContent;
            const date = new Date(post.created_at);
            const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

            return (
              <div 
                key={post.id} 
                className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-sm transition-all duration-300"
              >
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span className="font-medium text-muted-foreground">@{post.author}</span>
                  <span>{dateString}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {truncatedContent}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
