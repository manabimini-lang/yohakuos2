import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { ContentForm } from "@/components/admin/content-form";
import { updateContentAction } from "@/lib/actions/content/update-content";
import { prisma } from "@/lib/prisma";

type EditContentPageProps = {
  params: {
    id: string;
  };
};

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditContentPage({ params }: EditContentPageProps) {
  const [content, tags] = await Promise.all([
    prisma.content.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        content: true,
        contentType: true,
        visibility: true,
        publishStatus: true,
        layer: true,
        releaseDate: true,
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  if (!content) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">コンテンツ編集</h1>
          <p className="text-sm text-slate-600">既存コンテンツを編集します。</p>
        </div>
        <Link
          href="/admin/contents"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
        >
          一覧に戻る
        </Link>
      </div>

      <ContentForm
        tags={tags}
        initialValues={{
          title: content.title,
          slug: content.slug,
          description: content.description ?? "",
          thumbnailUrl: content.thumbnailUrl ?? "",
          content: content.content ?? "",
          contentType: content.contentType,
          visibility: content.visibility,
          publishStatus: content.publishStatus,
          layer: content.layer,
          releaseDate: toDateInputValue(content.releaseDate),
          tagIds: content.tags.map((tag) => tag.tagId),
        }}
        submitLabel="保存する"
        onSubmitAction={(values) => updateContentAction(content.id, values)}
      />
    </section>
  );
}
