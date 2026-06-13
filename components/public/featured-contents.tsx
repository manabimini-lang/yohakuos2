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
        <h2 className="text-lg font-medium text-foreground">最近の記事</h2>
        <Link href="/member/contents" className="text-sm text-muted-foreground hover:text-slate-700 transition-colors">
          すべて見る
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          記事はまだありません。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="h-36 bg-slate-50">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground"></div>
                )}
              </div>
              <div className="space-y-2 p-5">
                <h3 className="line-clamp-1 text-base font-medium text-foreground">{item.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description || "説明はまだありません。"}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
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
