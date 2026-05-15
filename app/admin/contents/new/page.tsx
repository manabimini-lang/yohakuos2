import Link from "next/link";

import { ContentForm } from "@/components/admin/content-form";
import { prisma } from "@/lib/prisma";

export default async function NewContentPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Create Content</h1>
          <p className="text-sm text-slate-600">新しいコンテンツを作成します。</p>
        </div>
        <Link
          href="/admin/contents"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
        >
          Back to list
        </Link>
      </div>
      <ContentForm tags={tags} />
    </section>
  );
}
