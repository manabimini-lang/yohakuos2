import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Reflection | YOHAKU",
};

export default async function ReflectionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const reflections = await prisma.audioReflection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  const latestReflection = reflections[0] ?? null;
  const previousReflection = reflections[1] ?? null;
  const today = new Date().toLocaleDateString("ja-JP", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <div className="max-w-3xl mx-auto px-6 pt-14 pb-24 space-y-10">
        <section className="space-y-4">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{today}</div>
          <div className="space-y-3">
            <h1 className="text-3xl font-light text-foreground">夜の机</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              今日はひとつの断片だけを静かに見つめる時間です。
            </p>
          </div>
        </section>

        <section>
          <Link
            href="/companion"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="font-medium text-slate-900">YOHAKUと話す</span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">今日の断片</div>
          {latestReflection ? (
            <div className="space-y-4 text-foreground">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{latestReflection.script}</p>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                今夜の静かな問い: どこに、もう一度戻りたいと感じていますか？
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">まだ振り返りは静かに育っています。</p>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">ひとつの過去記録</div>
          {previousReflection ? (
            <div className="space-y-3 text-foreground">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{previousReflection.script}</p>
              <div className="text-xs text-muted-foreground">{new Date(previousReflection.createdAt).toLocaleDateString("ja-JP")}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground leading-relaxed">
              過去の振り返りは、もう少しだけ積み重なってから現れます。
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>今夜は深掘りを急ぎません。静かな余白を保ちながら、翌日にまた戻ってきてください。</p>
        </div>

        <div className="flex justify-end">
          <Link href="/inbox" className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/10">
            Inboxに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
