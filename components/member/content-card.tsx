import { Lock } from "lucide-react";

import type { MemberContentItem } from "@/lib/content/member-query";

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function ContentCard({
  item,
  cardClassName,
  primaryColor,
}: {
  item: MemberContentItem;
  cardClassName?: string;
  primaryColor?: string;
}) {
  return (
    <article className={`overflow-hidden border border-slate-100 bg-white transition-shadow hover:shadow-md ${cardClassName ?? "rounded-2xl p-0 shadow-sm"}`}>
      <div className="relative h-40 bg-slate-50">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground"></div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.locked ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
              <Lock className="h-3 w-3" />
              会員限定
            </span>
          ) : null}
          {item.isNew ? (
            <span className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium tracking-wide text-slate-700 backdrop-blur border border-slate-200/50">
              新着
            </span>
          ) : null}
          {item.isRecommended ? (
            <span className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium tracking-wide text-slate-700 backdrop-blur border border-slate-200/50">
              おすすめ
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-medium text-foreground">{item.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {item.description || "説明はまだありません。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag.id} className="yohaku-tag">
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted-foreground pt-1">
          {item.contentType} / {item.layer} / {dateFmt.format(item.updatedAt)}
        </div>
      </div>
    </article>
  );
}
