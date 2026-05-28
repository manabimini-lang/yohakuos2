import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <main className="min-h-screen bg-[#090909] pb-28 text-slate-100">
      <div className="max-w-3xl mx-auto px-6 pt-14 pb-28 space-y-10">
        <section className="space-y-4">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500">{today}</div>
          <div className="space-y-3">
            <h1 className="text-3xl font-light text-white">夜の机</h1>
            <p className="text-sm leading-relaxed text-slate-400">
              今日はひとつの断片だけを静かに見つめる時間です。
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500">今日の断片</div>
          {latestReflection ? (
            <div className="space-y-4 text-slate-100">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{latestReflection.script}</p>
              <div className="rounded-3xl border border-white/10 bg-[#0B0B0B] px-4 py-3 text-sm text-slate-400">
                今夜の静かな問い: どこに、もう一度戻りたいと感じていますか？
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed">まだ振り返りは静かに育っています。</p>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500">ひとつの過去記録</div>
          {previousReflection ? (
            <div className="space-y-3 text-slate-200">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{previousReflection.script}</p>
              <div className="text-xs text-slate-500">{new Date(previousReflection.createdAt).toLocaleDateString("ja-JP")}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 leading-relaxed">
              過去の振り返りは、もう少しだけ積み重なってから現れます。
            </div>
          )}
        </section>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
          <p>今夜は深掘りを急ぎません。静かな余白を保ちながら、翌日にまた戻ってきてください。</p>
        </div>

        <div className="flex justify-end">
          <Link href="/inbox" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-white/10">
            Inboxに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
