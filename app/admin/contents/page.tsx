import Link from "next/link";

export const dynamic = "force-dynamic";

import { ContentTable } from "@/components/admin/content-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { CONTENT_PAGE_SIZE, getContentsList } from "@/lib/content/query";
import { prisma } from "@/lib/prisma";
import {
  buildSearchQuery,
  getPagination,
  parseSearchParams,
  type RawSearchParams,
} from "@/lib/utils/search-params";

export default async function AdminContentsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const params = parseSearchParams(searchParams, { page: 1, limit: CONTENT_PAGE_SIZE });

  const result = await getContentsList({
    params,
  });
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const pager = getPagination(result.page, result.limit, result.total);
  const baseQuery = {
    limit: result.limit,
    q: params.q,
    tag: params.tag,
    layer: params.layer,
    type: params.type,
    visibility: params.visibility,
    publishStatus: params.publishStatus,
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">コンテンツ管理</h1>
            <p className="text-sm text-slate-600">全 {result.total} 件</p>
          </div>
          <Link
            href="/admin/contents/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            新規作成
          </Link>
        </div>

        <FilterBar
          basePath="/admin/contents"
          params={{ ...params, limit: result.limit }}
          tags={tags}
          showAdminOnly
        />
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-base font-semibold text-slate-900">コンテンツがまだありません</h2>
          <p className="mt-2 text-sm text-slate-600">
            最初のコンテンツを作成して、学習プラットフォーム運用を開始しましょう。
          </p>
          <Link
            href="/admin/contents/new"
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            最初のコンテンツを作成
          </Link>
        </div>
      ) : (
        <ContentTable items={result.items} />
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-600">
          {pager.page} / {pager.totalPages} ページ
        </p>
        <div className="flex gap-2">
          {pager.hasPrev ? (
            <Link
              href={`/admin/contents${buildSearchQuery({ ...baseQuery, page: pager.prevPage })}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700"
            >
              前へ
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-slate-300">
              前へ
            </span>
          )}
          {pager.hasNext ? (
            <Link
              href={`/admin/contents${buildSearchQuery({ ...baseQuery, page: pager.nextPage })}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700"
            >
              次へ
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-slate-300">
              次へ
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
