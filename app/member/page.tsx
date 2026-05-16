import { ContentVisibility, PublishStatus } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { DashboardHero } from "@/components/member/dashboard-hero";
import { ProgressSummary } from "@/components/member/progress-summary";
import { RecentContents } from "@/components/member/recent-contents";
import { RecommendedSection } from "@/components/member/recommended-section";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings/get-settings";
import { getThemeClasses } from "@/lib/settings/theme";

function calculateRate(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export default async function MemberPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [completedCount, totalProgressCount, recentContents, settings] = await Promise.all([
    prisma.userProgress.count({
      where: { userId, completed: true },
    }),
    prisma.userProgress.count({
      where: { userId },
    }),
    prisma.content.findMany({
      where: {
        publishStatus: PublishStatus.PUBLISHED,
        visibility: { not: ContentVisibility.ADMIN },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        contentType: true,
        visibility: true,
        updatedAt: true,
      },
    }),
    getSiteSettings(),
  ]);

  const completionRate = calculateRate(completedCount, totalProgressCount);
  const name = session.user.name || session.user.email || "Member";

  const theme = getThemeClasses(settings.cardStyle);

  return (
    <div className={`space-y-5 ${theme.gap}`}>
      <header className={`border border-slate-200 bg-white ${theme.card}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {settings.siteTitle}
        </p>
        <p className="mt-1 text-sm text-slate-600">{settings.siteDescription}</p>
      </header>
      <DashboardHero name={name} role={session.user.role ?? "FREE_MEMBER"} />

      <ProgressSummary
        completedCount={completedCount}
        totalProgressCount={totalProgressCount}
        completionRate={completionRate}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <RecentContents items={recentContents} />
        <section className={`border border-slate-200 bg-white ${theme.card}`}>
          <h2 className="text-base font-semibold text-slate-900">Monthly Theme</h2>
          <p className="mt-2 text-sm text-slate-700">今月のテーマ: 学びを習慣化する。</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>週3回、15分の学習時間を固定する</li>
            <li>学んだ内容を1つアウトプットする</li>
            <li>月末に進捗を振り返って次月に反映する</li>
          </ul>
        </section>
      </div>

      <RecommendedSection />
      <div className="h-1 w-24 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
    </div>
  );
}
