import Link from "next/link";
import { ContentItem } from "@prisma/client";

export function ContentCard({ item }: { item: ContentItem }) {
  const isUrl = item.type === "url";
  const date = new Date(item.createdAt).toLocaleDateString("ja-JP");
  const summary = item.summary ? item.summary.slice(0, 80) : null;

  return (
    <Link
      href={`/inbox/${item.id}`}
      className="block h-full rounded-3xl border border-white/10 bg-[#0F0F0F]/95 p-5 transition-colors hover:border-white/15"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{isUrl ? "URL" : "PDF"}</p>
          <h3 className="text-base font-medium leading-tight text-slate-100 line-clamp-2">
            {item.title || item.url || item.fileName}
          </h3>
        </div>
        {item.reflection ? (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-slate-300">
            余白あり
          </span>
        ) : null}
      </div>

      {summary ? (
        <p className="text-sm leading-relaxed text-slate-400 line-clamp-3 mb-4">
          {summary}
          {item.summary && item.summary.length > 80 ? "…" : ""}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-500 mb-4">
          まだ静かに整理されています。
        </p>
      )}

      {item.aiTags && item.aiTags.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {item.aiTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate">
          {isUrl ? item.domain : item.fileName || "PDF保存"}
        </span>
        <span>{date}</span>
      </div>
    </Link>
  );
}
