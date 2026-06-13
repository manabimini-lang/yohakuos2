import Link from "next/link";
import { ContentItem } from "@prisma/client";

export function ContentCard({ item }: { item: ContentItem & { memoryScore?: number } }) {
  const isUrl = item.type === "url";
  const date = new Date(item.createdAt).toLocaleDateString("ja-JP");
  const summary = item.summary ? item.summary.slice(0, 80) : null;
  const imageUrl = item.thumbnailUrl;

  return (
    <Link
      href={`/inbox/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-[#0F0F0F] border border-border/50"
    >
      {/* 1. サムネイル最優先 */}
      {imageUrl ? (
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={item.title || ""}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative flex aspect-video w-full items-center justify-center bg-card p-6 text-center">
          <p className="text-sm font-light leading-relaxed text-muted-foreground line-clamp-3">
            {summary || "静かに整理されています"}
          </p>
        </div>
      )}

      {/* 2. テキスト・メタデータは補助情報 */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {/* PDFは最小限ラベル */}
          {item.type === "pdf" && (
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium tracking-widest text-muted-foreground">
              PDF
            </span>
          )}
          {/* ドメインは文脈情報 */}
          {item.domain && (
            <span className="text-[11px] tracking-wide text-muted-foreground">
              {item.domain.replace("www.", "")}
            </span>
          )}
        </div>

        <h3 className="text-sm font-light leading-snug text-foreground line-clamp-2">
          {item.title || item.url || item.fileName}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {item.aiTags && item.aiTags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-slate-600 tracking-wider font-mono">
            {date}
          </span>
        </div>

        {item.reflection && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <span className="text-[11px] text-muted-foreground font-light flex items-center gap-1.5">
              <span>✍</span> 振り返りあり
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
