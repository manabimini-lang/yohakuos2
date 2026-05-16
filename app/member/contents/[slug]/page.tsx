import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { ContentBody } from "@/components/member/content-body";
import { ContentHeader } from "@/components/member/content-header";
import { RelatedContents } from "@/components/member/related-contents";
import { auth } from "@/lib/auth";
import {
  getContentDetailBySlug,
  getNextSuggestion,
  getRelatedContents,
  isLockedForRole,
} from "@/lib/content/detail-query";

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function MemberContentDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = (session.user.role ?? UserRole.FREE_MEMBER) as UserRole;
  const content = await getContentDetailBySlug(params.slug);
  if (!content) {
    notFound();
  }

  const locked = isLockedForRole(role, content.visibility);
  const tagIds = content.tags.map((tag) => tag.tag.id);

  const [related, nextSuggestion] = await Promise.all([
    getRelatedContents(content.id, tagIds),
    getNextSuggestion(content.id, content.layer, content.contentType),
  ]);

  return (
    <div className="space-y-5">
      <ContentHeader
        thumbnailUrl={content.thumbnailUrl}
        title={content.title}
        description={content.description}
        tags={content.tags.map((t) => t.tag)}
        contentType={content.contentType}
        layer={content.layer}
        updatedAt={content.updatedAt}
      />

      <section className="relative">
        <div className={locked ? "pointer-events-none select-none blur-sm" : ""}>
          <ContentBody contentType={content.contentType} content={content.content} />
        </div>
        {locked ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 p-4">
            <div className="max-w-md rounded-xl border border-amber-300 bg-amber-50 p-5 text-center">
              <p className="text-sm font-semibold text-amber-800">PAIDプラン限定コンテンツです</p>
              <p className="mt-1 text-sm text-amber-700">
                FREE_MEMBER では本文を閲覧できません。アップグレードして学習を続けましょう。
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white"
              >
                プランをアップグレード
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Progress</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            完了として記録
          </button>
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
            学習済み
          </span>
        </div>
      </section>

      {nextSuggestion ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">Next Suggestion</h2>
          <p className="mt-2 text-sm text-slate-600">
            同一レイヤー / 同一タイプを優先した次のおすすめです。
          </p>
          <Link
            href={`/member/contents/${nextSuggestion.slug}`}
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline underline-offset-2"
          >
            {nextSuggestion.title} ({nextSuggestion.layer} / {nextSuggestion.contentType})
          </Link>
        </section>
      ) : null}

      <RelatedContents items={related} />
    </div>
  );
}
