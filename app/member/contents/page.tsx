import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
      <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-medium text-foreground">記事</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          気になるキーワードやタグで、静かに探せます。
        </p>
      </header>

      <FilterBar
        basePath="/member/contents"
        params={{ ...params, limit: result.limit }}
        tags={result.tags}
      />

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">記事が見つかりませんでした。</p>
          <p className="mt-2 text-xs text-muted-foreground">別のキーワードを試してみてください。</p>
          <Link
            href="/member/contents"
            className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-muted-foreground hover:text-slate-700 transition-colors"
          >
            条件をクリアする
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

      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-5 py-3 text-sm shadow-sm">
        <p className="text-muted-foreground">
          {pager.page} / {pager.totalPages}
        </p>
        <div className="flex gap-2">
          {pager.hasPrev ? (
            <Link
              href={`/member/contents${buildSearchQuery({ ...baseQuery, page: pager.prevPage })}`}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-slate-600 transition-colors hover:bg-slate-50"
            >
              前へ
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-4 py-1.5 text-muted-foreground bg-slate-50">
              前へ
            </span>
          )}
          {pager.hasNext ? (
            <Link
              href={`/member/contents${buildSearchQuery({ ...baseQuery, page: pager.nextPage })}`}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-slate-600 transition-colors hover:bg-slate-50"
            >
              次へ
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-4 py-1.5 text-muted-foreground bg-slate-50">
              次へ
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
