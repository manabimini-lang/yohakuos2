import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InboxGrid } from "@/components/capture/InboxGrid";
import { EmptyInbox } from "@/components/capture/EmptyInbox";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare, ArrowRight } from "lucide-react";
import { getStarterJourneyStatus } from "@/lib/ai/starter-journey";

export const metadata: Metadata = {
  title: "Inbox | YOHAKU",
};

export default async function InboxPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;

  const items = await prisma.contentItem.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const [userSettings, starterJourney] = await Promise.all([
    prisma.userAISettings.findUnique({
      where: { userId },
    }),
    getStarterJourneyStatus(userId),
  ]);

  const today = new Date().toLocaleDateString("ja-JP", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  const hasAiAccess = userSettings?.isEnabled || starterJourney.active;
  const showHiddenFeatures = items.length >= 5 && hasAiAccess;

  return (
    <main className="min-h-screen bg-[#090909] pb-28 text-white/80">
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-28">
        <header className="space-y-4 pb-10 border-b border-white/10">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500">{today}</div>
          <div className="space-y-2">
            <h1 className="text-3xl font-light tracking-tight text-white">Inbox</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              ここは静かに戻ってくるための余白です。残したいものをひとつずつ置いて、夜に少しだけ開いてみてください。
            </p>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/55">
                <MessageSquare className="h-4 w-4" />
                <p className="text-xs tracking-[0.22em] uppercase">Discord Connection</p>
              </div>
              <h2 className="text-lg font-light text-white/90">
                コミュニティとのつながりを、設定から整えましょう。
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                Discord連携は設定画面で行えます。連携すると、小さな実践の共有やコミュニティの声を静かに受け取れます。
              </p>
            </div>
            <Link
              href="/settings/account"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white text-slate-900 px-5 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              Discordを設定する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-10 space-y-8">
          {items.length > 0 ? (
            <InboxGrid items={items} />
          ) : (
            <EmptyInbox />
          )}
        </section>

        {showHiddenFeatures && (
          <section className="mt-24 pt-16 border-t border-white/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
            <h2 className="text-xs tracking-[0.2em] uppercase text-white/40">
              今日の余白
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quiet Return */}
              <Link 
                href="/quiet-return"
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-light text-white/80">静かな戻り</h3>
                  <p className="text-sm font-light text-white/40 leading-relaxed">
                    以前の記録に、<br />もう一度出会ってみる。
                  </p>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Learning */}
              <Link 
                href="/learning"
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-light text-white/80">今日の学び</h3>
                  <p className="text-sm font-light text-white/40 leading-relaxed">
                    保存した記録から、<br />ゆっくり学びを振り返る。
                  </p>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Ritual */}
              <Link 
                href="/ritual"
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-light text-white/80">小さな儀式</h3>
                  <p className="text-sm font-light text-white/40 leading-relaxed">
                    考える前に、<br />少しだけ整える。
                  </p>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
