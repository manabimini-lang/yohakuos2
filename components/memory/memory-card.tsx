import React from "react";
import { ContentItem } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Body, Caption } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Youtube, FileText, Link as LinkIcon, FileImage } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";

interface MemoryCardProps {
  memory: ContentItem;
  className?: string;
}

export function MemoryCard({ memory, className = "" }: MemoryCardProps) {
  // Source Icon resolution
  const Icon = memory.type === "youtube" ? Youtube
    : memory.type === "pdf" ? FileText
    : memory.type === "photo" ? FileImage
    : LinkIcon;

  // Formatting date
  const relativeDate = formatDistanceToNow(new Date(memory.createdAt), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <Link href={`/inbox/${memory.id}`} className="block group">
      <Card className={`p-5 flex flex-col gap-4 min-h-[160px] transition-all duration-300 hover:border-slate-300 hover:shadow-md ${className}`}>
        
        {/* 1. Reflection (Most Important) */}
        {memory.reflection ? (
          <p className="text-foreground font-serif italic text-sm leading-relaxed line-clamp-3 group-hover:text-foreground transition-colors">
            「{memory.reflection}」
          </p>
        ) : (
          <p className="text-muted-foreground/40 font-serif italic text-sm">
            (No reflection)
          </p>
        )}

        <div className="flex-1" />

        {/* 2. Title & Icon */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <Body className="line-clamp-1 font-medium group-hover:underline decoration-border underline-offset-4">
              {memory.title || "Untitled Memory"}
            </Body>
          </div>

          {/* 3 & 4. Tags and Saved Date */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {memory.aiTags && memory.aiTags.slice(0, 3).map((tag, i) => (
                <Badge key={i} className="text-[10px] px-1.5 py-0 bg-secondary/50">
                  #{tag}
                </Badge>
              ))}
            </div>
            <Caption className="text-[10px] text-muted-foreground shrink-0">
              {relativeDate}
            </Caption>
          </div>
        </div>
      </Card>
    </Link>
  );
}
