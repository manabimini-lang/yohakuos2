type RecentContent = {
  id: string;
  title: string;
  contentType: string;
  visibility: string;
  updatedAt: Date;
};

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function RecentContents({ items }: { items: RecentContent[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Recent Contents</h2>
        <span className="text-xs text-muted-foreground">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-muted-foreground">
          公開コンテンツはまだありません。
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
            >
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.contentType} / {item.visibility} / Updated {dateFmt.format(item.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
