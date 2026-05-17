import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dailyLogRepository } from "@/lib/repositories/daily-log.repository";
import { YohakuHomeClient } from "@/components/member/yohaku-home-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ホーム - YOHAKU",
  description: "静かな振り返り空間",
};

export default async function MemberPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 最後のログを取得
  const recentLogs = await dailyLogRepository.findRecentByUserId(userId, 1);
  const lastLog = recentLogs.length > 0 ? recentLogs[0] : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white/30 selection:bg-slate-100">
      <YohakuHomeClient lastLog={lastLog} />
    </div>
  );
}
