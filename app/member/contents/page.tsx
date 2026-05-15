import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentCard } from "@/components/member/content-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { auth } from "@/lib/auth";
import { getMemberContents, MEMBER_CONTENTS_PAGE_SIZE } from "@/lib/content/member-query";
import { getSiteSettings } from "@/lib/settings/get-settings";
import { getThemeClasses } from "@/lib/settings/theme";
import {
  buildSearchQuery,
  getPagination,
  parseSearchParams,
  type RawSearchParams,
} from "@/lib/utils/search-params";

export default async function MemberContentsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = (session.user.role ?? UserRole.FREE_MEMBER) as UserRole;
  const params = parseSearchParams(searchParams, { page: 1, limit: MEMBER_CONTENTS_PAGE_SIZE });

  const [result, settings] = await Promise.all([
    getMemberContents({
      role,
      params,
    }),
    getSiteSettings(),
  ]);
  const theme = getThemeClasses(settings.cardStyle);
  const pager = getPagination(result.page, result.limit, result.total);
  const baseQuery = {
    limit: result.limit,
    q: params.q,
    tag: params.tag,
    layer: params.layer,
    type: params.type,
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-semibold text-slate-900">Contents</h1>
        <p className="mt-1 text-sm text-slate-600">
          {settings.siteTitle} の学びたいテーマを絞り込みながらコンテンツを探せます。
        </p>
      </header>

      <FilterBar
        basePath="/member/contents"
        params={{ ...params, limit: result.limit }}
        tags={result.tags}
      />

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">条件に一致するコンテンツがありません。</p>
          <p className="mt-1 text-xs text-slate-400">タグ・レイヤー・キーワードを見直してみてください。</p>
          <Link
            href="/member/contents"
            className="mt-4 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            フィルタをリセット
          </Link>
        </div>
      ) : (
        <div className={`grid sm:grid-cols-2 xl:grid-cols-3 ${theme.gap}`}>
          {result.items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              cardClassName={theme.card}
              primaryColor={settings.primaryColor}
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
              href={`/member/contents${buildSearchQuery({ ...baseQuery, page: pager.prevPage })}`}
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
              href={`/member/contents${buildSearchQuery({ ...baseQuery, page: pager.nextPage })}`}
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
