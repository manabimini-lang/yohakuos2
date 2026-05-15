import {
  ContentStatusBadge,
  publishStatusTone,
  visibilityTone,
} from "@/components/admin/content-status-badge";
import type { ContentListItem } from "@/lib/content/query";

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function renderDate(value: Date | null) {
  if (!value) return "-";
  return dateFmt.format(value);
}

function thumbFallback(title: string) {
  return title.charAt(0).toUpperCase();
}

export function ContentTable({ items }: { items: ContentListItem[] }) {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Thumbnail</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Visibility</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Layer</th>
                <th className="px-4 py-3 font-semibold">Release Date</th>
                <th className="px-4 py-3 font-semibold">Updated At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-4 py-3">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-10 w-16 rounded-md border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500">
                        {thumbFallback(item.title)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-3">{item.contentType}</td>
                  <td className="px-4 py-3">
                    <ContentStatusBadge
                      label={item.visibility}
                      tone={visibilityTone(item.visibility)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ContentStatusBadge
                      label={item.publishStatus}
                      tone={publishStatusTone(item.publishStatus)}
                    />
                  </td>
                  <td className="px-4 py-3">{item.layer}</td>
                  <td className="px-4 py-3">{renderDate(item.releaseDate)}</td>
                  <td className="px-4 py-3">{renderDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 lg:hidden">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex gap-3">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="h-14 w-20 rounded-md border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-20 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
                    {thumbFallback(item.title)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.contentType}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <ContentStatusBadge
                      label={item.visibility}
                      tone={visibilityTone(item.visibility)}
                    />
                    <ContentStatusBadge
                      label={item.publishStatus}
                      tone={publishStatusTone(item.publishStatus)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p>Layer: {item.layer}</p>
                <p>Release: {renderDate(item.releaseDate)}</p>
                <p className="col-span-2">Updated: {renderDate(item.updatedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
