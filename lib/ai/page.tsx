import { auth } from "@/lib/auth";
import { generateYohaku } from "@/lib/ai/yohaku-generator";
import { generateShareMarkdown } from "@/lib/ai/share-generator";
import { ShareCard } from "@/components/share/share-card";
import { redirect } from "next/navigation";

export default async function SharePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const yohakuData = await generateYohaku(session.user.id);
  const markdown = generateShareMarkdown(
    yohakuData.dominantThemes,
    yohakuData.dominantContexts,
    yohakuData.reflection
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-24 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-serif text-slate-900 dark:text-slate-100 tracking-tight">共有</h1>
        <p className="text-sm text-muted-foreground">今日の気づきをDiscordの仲間に共有します</p>
      </div>

      <ShareCard
        themes={yohakuData.dominantThemes}
        contexts={yohakuData.dominantContexts}
        reflection={yohakuData.reflection}
        markdown={markdown}
      />
    </div>
  );
}