import { useState, useEffect } from "react";
import { 
  Play, 
  BookOpen, 
  ExternalLink, 
  Lock, 
  Clock, 
  Tag, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Content, ContentLayer } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ContentCardProps {
  content: Content;
  index?: number;
  key?: string | number;
}

export function ContentCard({ content, index = 0 }: ContentCardProps) {
  const { logEvent } = useAnalytics();
  const isLocked = content.layer !== "public"; // Simplified for demo

  useEffect(() => {
    // track impression
    logEvent('content_view', { 
        content_id: content.id, 
        category: content.category, 
        title: content.title 
    });
  }, [content.id]);

  const handleClick = () => {
    logEvent('content_click', { 
        content_id: content.id, 
        category: content.category,
        title: content.title
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      group="true"
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-notion-bg ring-1 ring-border/50 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-brand/5 group-hover:-translate-y-1">
        {content.thumbnail_url ? (
          <img
            src={content.thumbnail_url}
            alt={content.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/5 to-purple-500/5">
            <BookOpen className="h-10 w-10 text-brand/20" />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        
        <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn(
                "border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5",
                content.layer === "public" ? "bg-white/90 text-blue-600 backdrop-blur" : 
                content.layer === "member" ? "bg-brand text-white" : "bg-amber-500 text-white"
            )}>
                {content.layer === "public" ? "Free" : "Member"}
            </Badge>
        </div>

        {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur text-white border border-white/30">
                    <Lock className="h-5 w-5" />
                </div>
            </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>{content.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                5 min read
            </span>
        </div>
        <h3 className="font-bold text-base leading-tight group-hover:text-brand transition-colors line-clamp-2">
          {content.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {content.description}
        </p>
      </div>
    </motion.div>
  );
}
