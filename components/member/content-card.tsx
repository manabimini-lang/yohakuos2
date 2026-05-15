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
    <article className={`overflow-hidden border border-slate-200 bg-white ${cardClassName ?? "rounded-2xl p-0"}`}>
      <div className="relative h-40 bg-slate-100">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
            NO IMAGE
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {item.locked ? (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primaryColor ?? "#f59e0b" }}>
              <Lock className="h-3 w-3" />
              Locked
            </span>
          ) : null}
          {item.isNew ? (
            <span className="rounded-md bg-emerald-500/95 px-2 py-1 text-xs font-semibold text-white">
              New
            </span>
          ) : null}
          {item.isRecommended ? (
            <span className="rounded-md bg-sky-500/95 px-2 py-1 text-xs font-semibold text-white">
              Recommended
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {item.description || "説明はまだありません。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          {item.contentType} / {item.layer} / {dateFmt.format(item.updatedAt)}
        </div>
      </div>
    </article>
  );
}
