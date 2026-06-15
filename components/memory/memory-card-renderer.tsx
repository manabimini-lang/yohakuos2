"use client";

import React from "react";
import { Youtube, Instagram, Twitter, BookOpen, FileText, Globe, Play, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentItemType, MemoryMetadata } from "@/lib/ai/provider";
import { ThemeType } from "@prisma/client";

interface MemoryCardProps {
  type: ContentItemType | string;
  url: string;
  snapshotUrl?: string | null;
  thumbnailUrl?: string | null;
  metadata: MemoryMetadata;
  summary?: string | null;
  theme?: ThemeType | null;
  tags?: string[];
  meaningStatus?: string | null;
  connectionCount?: number;
  isProcessing?: boolean;
  className?: string;
}

export function MemoryCardRenderer({
  type,
  url,
  snapshotUrl,
  thumbnailUrl,
  metadata,
  summary,
  tags,
  meaningStatus,
  connectionCount,
  isProcessing = false,
  className,
}: MemoryCardProps) {
  // 優先順位: Snapshot > Thumbnail > Fallback
  const displayImage = snapshotUrl || thumbnailUrl;

  const loadingMessage = "記録の意味を整理しています...";

  const renderConnectionBadge = () => {
    if (!connectionCount || connectionCount === 0) return null;
    return (
      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-medium">
        <Layers className="h-2.5 w-2.5" />
        <span>続きの記憶</span>
      </div>
    );
  };

  if (isProcessing) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 mb-3" />
        <p className="text-[11px] text-slate-400 font-medium">保存した景色を残しています...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (type) {
      case "youtube":
        return (
          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 shadow-sm group">
              {displayImage && <img src={displayImage} alt="" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Play className="h-2.5 w-2.5 fill-current" />
                {metadata.duration || "0:00"}
              </div>
              <div className="absolute top-2 left-2 rounded-full bg-white/90 p-1.5 shadow-sm">
                <Youtube className="h-3 w-3 text-red-600" />
              </div>
            </div>
            <div className="px-1">
              <h3 className="text-xs font-semibold leading-snug line-clamp-2 text-slate-800">{metadata.title}</h3>
              <p className="mt-1 text-[10px] text-slate-500">{metadata.channelName}</p>
              {/* Meaning Layer */}
              {meaningStatus === "pending" || meaningStatus === "processing" ? (
                <p className="mt-2 text-[10px] text-slate-400 animate-pulse">{loadingMessage}</p>
              ) : summary ? (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-slate-600 line-clamp-2">{summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags?.map(tag => <span key={tag} className="text-[9px] text-slate-400">#{tag}</span>)}
                  </div>
                </div>
              ) : null}
              {renderConnectionBadge()}
            </div>
          </div>
        );

      case "instagram":
        return (
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 shadow-sm group">
            {displayImage && <img src={displayImage} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                {metadata.isReel && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold backdrop-blur-md">
                    <Play className="h-2.5 w-2.5 fill-current" /> REEL
                  </span>
                )}
              </div>
              {/* Meaning Layer for Instagram */}
              {meaningStatus === "pending" || meaningStatus === "processing" ? (
                <p className="mt-2 text-[10px] text-white/60 animate-pulse font-sans">{loadingMessage}</p>
              ) : summary ? (
                <div className="mt-2">
                  <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed font-serif italic">"{summary}"</p>
                </div>
              ) : null}
            </div>
          </div>
        );

      case "x":
        return (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Twitter className="h-3 w-3 text-slate-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">{metadata.author || "@user"}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 line-clamp-4 italic font-serif">
              "{metadata.tweetText || metadata.description}"
            </p>
            {/* Meaning Layer for X */}
            {meaningStatus === "pending" || meaningStatus === "processing" ? (
              <p className="text-[10px] text-slate-400 animate-pulse">{loadingMessage}</p>
            ) : summary ? (
              <div className="pt-2 border-t border-slate-50 space-y-1">
                <p className="text-[11px] text-slate-500 line-clamp-2">{summary}</p>
                <div className="flex flex-wrap gap-1">
                  {tags?.map(tag => <span key={tag} className="text-[9px] text-slate-400">#{tag}</span>)}
                </div>
              </div>
            ) : null}
          </div>
        );

      case "note":
        return (
          <div className="space-y-3">
            <div className="relative aspect-[1.91/1] overflow-hidden rounded-xl border border-slate-100">
              {displayImage && <img src={displayImage} alt="" className="h-full w-full object-cover" />}
              <div className="absolute top-2 right-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                note
              </div>
            </div>
            <div className="px-1">
              <h3 className="text-xs font-bold leading-relaxed text-slate-800 line-clamp-2 font-serif">
                {metadata.title}
              </h3>
              {/* Meaning Layer */}
              {meaningStatus === "pending" || meaningStatus === "processing" ? (
                <p className="mt-2 text-[10px] text-slate-400 animate-pulse">{loadingMessage}</p>
              ) : summary ? (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] text-slate-600 line-clamp-2">{summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags?.map(tag => <span key={tag} className="text-[9px] text-slate-400">#{tag}</span>)}
                  </div>
                </div>
              ) : (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-slate-200" />
                <span className="text-[10px] text-slate-500">{metadata.author}</span>
              </div>
              )}
              {renderConnectionBadge()}
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-100/50">
            <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200">
              <FileText className="h-6 w-6 text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xs font-medium text-slate-800">{metadata.title || "Document.pdf"}</h3>
              <p className="mt-1 text-[10px] text-slate-500">
                PDF {metadata.pageCount ? `• ${metadata.pageCount} pages` : ""}
              </p>
              {/* Meaning Layer for PDF */}
              {meaningStatus === "pending" || meaningStatus === "processing" ? (
                <p className="mt-1 text-[9px] text-slate-400 animate-pulse">{loadingMessage}</p>
              ) : summary ? (
                <div className="mt-1 space-y-1">
                  <p className="text-[10px] text-slate-600 line-clamp-1">{summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags?.slice(0, 2).map(tag => <span key={tag} className="text-[8px] text-slate-400">#{tag}</span>)}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );

      case "image":
        return (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            {displayImage && (
              <img src={displayImage} alt="" className="h-full w-full object-contain max-h-[300px]" />
            )}
            {/* Meaning Layer for Image */}
            <div className="p-3 bg-white border-t border-slate-50">
              {meaningStatus === "pending" || meaningStatus === "processing" ? (
                <p className="text-[10px] text-slate-400 animate-pulse">{loadingMessage}</p>
              ) : summary ? (
                <p className="text-[11px] text-slate-600 line-clamp-2">{summary}</p>
              ) : null}
            </div>
          </div>
        );

      default: // website
        return (
          <div className="group space-y-3">
            {displayImage && (
              <div className="aspect-[1.91/1] overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                <img src={displayImage} alt="" className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
              </div>
            )}
            <div className="px-1">
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                <Globe className="h-2.5 w-2.5" />
                {metadata.siteName || "Website"}
              </div>
              <h3 className="mt-1 text-xs font-semibold leading-snug text-slate-800 line-clamp-2">{metadata.title}</h3>
              {/* Meaning Layer for Website */}
              {meaningStatus === "pending" || meaningStatus === "processing" ? (
                <p className="mt-2 text-[10px] text-slate-400 animate-pulse">{loadingMessage}</p>
              ) : summary ? (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 italic">{summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags?.map(tag => <span key={tag} className="text-[9px] text-slate-400">#{tag}</span>)}
                  </div>
                </div>
              ) : metadata.description && !displayImage && (
                <p className="mt-2 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {metadata.description}
                </p>
              )}
              {renderConnectionBadge()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("group cursor-pointer transition-all active:scale-[0.98]", className)}>
      {renderContent()}
    </div>
  );
}