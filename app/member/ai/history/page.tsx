import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MemberAiHistoryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  const isPaidMember = user.role === "PAID_MEMBER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (!isPaidMember) {
    redirect("/member/ai"); // Redirect to the AI page which handles the upsell
  }

  const logs = await prisma.aILog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50, // MVP: Show last 50 entries
  });

  const dateFmt = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">過去の対話</h1>
        <p className="mt-1 text-sm text-slate-600">
          これまでの思考の整理の記録です。
        </p>
      </div>

      <div className="space-y-8">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            まだ記録がありません。
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="space-y-4 relative pl-4 border-l-2 border-slate-100">
              <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-slate-200" />
              <div className="text-xs text-slate-400 font-medium">
                {dateFmt.format(log.createdAt)}
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {log.input}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {log.response}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
