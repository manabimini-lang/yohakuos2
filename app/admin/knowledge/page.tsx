import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Plus, Check, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  const session = await auth();
  
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  const knowledgeContents = await prisma.knowledgeContent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 bg-white dark:bg-black min-h-screen text-notion-text dark:text-foreground">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide mb-2">Knowledge Contents</h1>
          <p className="text-sm text-notion-text/50">YOHAKUのLearning Layerの基盤となる知識コンテンツの管理。</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-foreground dark:bg-white dark:text-black rounded-lg text-sm font-medium hover:opacity-80 transition-opacity">
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </header>

      <div className="bg-notion-bg/30 dark:bg-card border border-notion-border/50 dark:border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-notion-border/50 dark:border-border text-notion-text/60 dark:text-foreground/60">
              <th className="font-medium p-4 pl-6">タイトル</th>
              <th className="font-medium p-4">タイプ</th>
              <th className="font-medium p-4">タグ</th>
              <th className="font-medium p-4">状態</th>
              <th className="font-medium p-4 text-right pr-6">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-notion-border/30 dark:divide-white/5">
            {knowledgeContents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-notion-text/40">コンテンツがありません</td>
              </tr>
            )}
            {knowledgeContents.map((content) => (
              <tr key={content.id} className="hover:bg-notion-bg/50 dark:hover:bg-card transition-colors">
                <td className="p-4 pl-6 font-medium">{content.title}</td>
                <td className="p-4 text-notion-text/70 dark:text-foreground/70">{content.contentType}</td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    {content.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${content.isPublished ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>
                    {content.isPublished ? '公開中' : '下書き'}
                  </span>
                </td>
                <td className="p-4 text-right pr-6">
                  <button className="text-xs text-blue-500 hover:underline">編集</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
