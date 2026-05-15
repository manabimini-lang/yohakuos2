import Link from "next/link";

type FeaturedContent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  contentType: string;
  layer: string;
  updatedAt: Date;
};

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function FeaturedContents({ items }: { items: FeaturedContent[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Featured Contents</h2>
        <Link href="/member/contents" className="text-sm text-slate-600 underline underline-offset-2">
          もっと見る
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          公開コンテンツは準備中です。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-36 bg-slate-100">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    NO IMAGE
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {item.description || "説明はまだありません。"}
                </p>
                <p className="text-xs text-slate-500">
                  {item.contentType} / {item.layer} / {dateFmt.format(item.updatedAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
