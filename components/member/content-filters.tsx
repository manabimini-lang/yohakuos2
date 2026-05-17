import { ContentLayer, ContentType } from "@prisma/client";

type TagOption = {
  id: string;
  name: string;
  slug: string;
};

type ContentFiltersProps = {
  search?: string;
  tag?: string;
  layer?: string;
  contentType?: string;
  tags: TagOption[];
};

export function ContentFilters({ search, tag, layer, contentType, tags }: ContentFiltersProps) {
  return (
    <form className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
      <label className="lg:col-span-2">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">
          キーワード
        </span>
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="タイトル検索"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">
          タグ
        </span>
        <select name="tag" defaultValue={tag ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none">
          <option value="">すべてのタグ</option>
          {tags.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">
          レイヤー
        </span>
        <select name="layer" defaultValue={layer ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none">
          <option value="">すべてのレイヤー</option>
          {Object.values(ContentLayer).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">
          種類
        </span>
        <select
          name="contentType"
          defaultValue={contentType ?? ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none"
        >
          <option value="">すべての種類</option>
          {Object.values(ContentType).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="page" value="1" />
      <div className="flex items-end gap-2 lg:col-span-5 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          絞り込む
        </button>
        <a
          href="/member/contents"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          リセット
        </a>
      </div>
    </form>
  );
}
