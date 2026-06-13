import Link from "next/link";

type RelatedItem = {
  id: string;
  slug: string;
  title: string;
  contentType: string;
  layer: string;
  updatedAt: Date;
};

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function RelatedContents({ items }: { items: RelatedItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-base font-semibold text-foreground">Related Contents</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">関連記事はまだありません。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-3">
              <Link href={`/member/contents/${item.slug}`} className="text-sm font-medium text-foreground">
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.contentType} / {item.layer} / {dateFmt.format(item.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
