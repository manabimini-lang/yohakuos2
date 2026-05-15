import { ContentLayer, ContentType, ContentVisibility, PublishStatus } from "@prisma/client";
import Link from "next/link";

import { SearchInput } from "@/components/shared/search-input";

type TagOption = { id: string; name: string; slug: string };

type FilterBarProps = {
  basePath: string;
  params: {
    q?: string;
    tag?: string;
    layer?: string;
    type?: string;
    visibility?: string;
    publishStatus?: string;
    limit?: number;
  };
  tags?: TagOption[];
  showAdminOnly?: boolean;
};

function SelectField({
  label,
  name,
  value,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  value?: string;
  options: string[];
  allLabel: string;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ basePath, params, tags = [], showAdminOnly = false }: FilterBarProps) {
  return (
    <form className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <SearchInput defaultValue={params.q} placeholder="タイトル・説明・タグ検索" />
      </div>

      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tag
        </span>
        <select
          name="tag"
          defaultValue={params.tag ?? ""}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>

      <SelectField
        label="Layer"
        name="layer"
        value={params.layer}
        options={Object.values(ContentLayer)}
        allLabel="All Layers"
      />
      <SelectField
        label="Type"
        name="type"
        value={params.type}
        options={Object.values(ContentType)}
        allLabel="All Types"
      />

      {showAdminOnly ? (
        <>
          <SelectField
            label="Visibility"
            name="visibility"
            value={params.visibility}
            options={Object.values(ContentVisibility)}
            allLabel="All Visibility"
          />
          <SelectField
            label="Status"
            name="publishStatus"
            value={params.publishStatus}
            options={Object.values(PublishStatus)}
            allLabel="All Status"
          />
        </>
      ) : null}

      <input type="hidden" name="limit" value={String(params.limit ?? 12)} />
      <input type="hidden" name="page" value="1" />
      <div className="flex items-end gap-2 lg:col-span-6">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <Link
          href={basePath}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
