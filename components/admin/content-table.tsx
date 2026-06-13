import {
  ContentStatusBadge,
  publishStatusTone,
  visibilityTone,
} from "@/components/admin/content-status-badge";
import type { ContentListItem } from "@/lib/content/query";
import {
  CONTENT_TYPE_LABELS,
  LAYER_LABELS,
  PUBLISH_STATUS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/translations";

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
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">サムネイル</th>
                <th className="px-4 py-3 font-semibold">タイトル</th>
                <th className="px-4 py-3 font-semibold">タイプ</th>
                <th className="px-4 py-3 font-semibold">公開範囲</th>
                <th className="px-4 py-3 font-semibold">ステータス</th>
                <th className="px-4 py-3 font-semibold">レイヤー</th>
                <th className="px-4 py-3 font-semibold">公開予定日</th>
                <th className="px-4 py-3 font-semibold">更新日時</th>
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
                      <div className="flex h-10 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs font-semibold text-muted-foreground">
                        {thumbFallback(item.title)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="px-4 py-3">{CONTENT_TYPE_LABELS[item.contentType]}</td>
                  <td className="px-4 py-3">
                    <ContentStatusBadge
                      label={VISIBILITY_LABELS[item.visibility]}
                      tone={visibilityTone(item.visibility)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ContentStatusBadge
                      label={PUBLISH_STATUS_LABELS[item.publishStatus]}
                      tone={publishStatusTone(item.publishStatus)}
                    />
                  </td>
                  <td className="px-4 py-3">{LAYER_LABELS[item.layer]}</td>
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
                  <div className="flex h-14 w-20 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-semibold text-muted-foreground">
                    {thumbFallback(item.title)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{CONTENT_TYPE_LABELS[item.contentType]}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <ContentStatusBadge
                      label={VISIBILITY_LABELS[item.visibility]}
                      tone={visibilityTone(item.visibility)}
                    />
                    <ContentStatusBadge
                      label={PUBLISH_STATUS_LABELS[item.publishStatus]}
                      tone={publishStatusTone(item.publishStatus)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p>レイヤー: {LAYER_LABELS[item.layer]}</p>
                <p>公開予定: {renderDate(item.releaseDate)}</p>
                <p className="col-span-2">更新日時: {renderDate(item.updatedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
