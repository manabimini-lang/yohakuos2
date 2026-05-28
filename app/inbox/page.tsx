import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InboxGrid } from "@/components/capture/InboxGrid";
import { EmptyInbox } from "@/components/capture/EmptyInbox";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox | YOHAKU",
};

export default async function InboxPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const items = await prisma.contentItem.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const today = new Date().toLocaleDateString("ja-JP", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#090909] pb-28">
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

        <section className="mt-10 space-y-8">
          {items.length > 0 ? (
            <InboxGrid items={items} />
          ) : (
            <EmptyInbox />
          )}
        </section>
      </div>
    </main>
  );
}
