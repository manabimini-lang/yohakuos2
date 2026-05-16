export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentCard } from "@/components/member/content-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { buildFilterQuery } from "@/lib/content/filter-query";
import { prisma } from "@/lib/prisma";
import {
  buildSearchQuery,
  getPagination,
  parseSearchParams,
  type RawSearchParams,
} from "@/lib/utils/search-params";

type TagPageProps = {
  params: { slug: string };
  searchParams: RawSearchParams;
};

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const tag = await prisma.tag.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  });
  if (!tag) notFound();

  const parsed = parseSearchParams(searchParams, { page: 1, limit: 12 });
  const where = buildFilterQuery({ ...parsed, mode: "tag", tagSlug: tag.slug });

  const [items, total, tags] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (parsed.page - 1) * parsed.limit,
      take: parsed.limit,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        contentType: true,
        layer: true,
        visibility: true,
        updatedAt: true,
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.content.count({ where }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const pager = getPagination(parsed.page, parsed.limit, total);
  const baseQuery = {
    q: parsed.q,
    layer: parsed.layer,
    type: parsed.type,
    limit: pager.limit,
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-semibold text-slate-900">Tag: {tag.name}</h1>
        <p className="mt-1 text-sm text-slate-600">Related contents: {total}</p>
      </header>

      <FilterBar
        basePath={`/tags/${tag.slug}`}
        params={{ ...parsed, limit: pager.limit }}
        tags={tags}
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">このタグに一致するコンテンツがありません。</p>
          <p className="mt-1 text-xs text-slate-400">条件を変えて再検索してください。</p>
          <Link
            href={`/tags/${tag.slug}`}
            className="mt-4 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            フィルタをリセット
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <ContentCard
              key={item.id}
              item={{
                ...item,
                tags: item.tags.map((t) => t.tag),
                locked: item.visibility === "PAID",
                isNew: Date.now() - item.updatedAt.getTime() <= 1000 * 60 * 60 * 24 * 7,
                isRecommended: index < 3,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-600">
          Page {pager.page} / {pager.totalPages}
        </p>
        <div className="flex gap-2">
          {pager.hasPrev ? (
            <Link
              href={`/tags/${tag.slug}${buildSearchQuery({ ...baseQuery, page: pager.prevPage })}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700"
            >
              Prev
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-slate-300">
              Prev
            </span>
          )}
          {pager.hasNext ? (
            <Link
              href={`/tags/${tag.slug}${buildSearchQuery({ ...baseQuery, page: pager.nextPage })}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-slate-300">
              Next
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
