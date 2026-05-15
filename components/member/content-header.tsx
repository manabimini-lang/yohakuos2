type ContentHeaderProps = {
  thumbnailUrl: string | null;
  title: string;
  description: string | null;
  tags: { id: string; name: string; slug: string }[];
  contentType: string;
  layer: string;
  updatedAt: Date;
};

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function ContentHeader(props: ContentHeaderProps) {
  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-52 bg-slate-100">
        {props.thumbnailUrl ? (
          <img src={props.thumbnailUrl} alt={props.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
            NO IMAGE
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <h1 className="text-2xl font-semibold text-slate-900">{props.title}</h1>
        {props.description ? <p className="text-sm text-slate-600">{props.description}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          {props.tags.map((tag) => (
            <span key={tag.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
              #{tag.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {props.contentType} / {props.layer} / Updated {dateFmt.format(props.updatedAt)}
        </p>
      </div>
    </header>
  );
}
