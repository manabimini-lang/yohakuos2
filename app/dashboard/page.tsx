import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildContextProfile } from "@/lib/memory/context-profile";
import { ContextProfileSection } from "@/components/memory/ContextProfileSection";
import { MemoryCard } from "@/components/memory/memory-card";
import { PageTitle, SectionTitle, Body, Caption } from "@/components/ui/typography";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

export const metadata: Metadata = {
  title: "YOHAKU - ダッシュボード",
  description: "人生の文脈が静かに蓄積される場所",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  // 1. Current Context
  const contextProfile = await buildContextProfile(userId);

  // 2. Quiet Return (Resurfacing Algorithm v1)
  // Get an old memory that has a reflection, hasn't been viewed recently
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const quietReturnCandidates = await prisma.contentItem.findMany({
    where: {
      userId,
      reflection: { not: null },
      createdAt: { lt: threeMonthsAgo },
    },
    select: CONTENT_ITEM_SAFE_SELECT,
    orderBy: { createdAt: "desc" },
    take: 1,
  }) as any[];
  const quietReturnItem = quietReturnCandidates[0] || null;

  // 3. Recent Inbox
  // Top 3 recent items
  const recentItems = await prisma.contentItem.findMany({
    where: { userId },
    select: CONTENT_ITEM_SAFE_SELECT,
    orderBy: { createdAt: "desc" },
    take: 3,
  }) as any[];

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="max-w-2xl mx-auto px-6 pt-16 space-y-24">
        
        {/* Header */}
        <header className="space-y-4">
          <Caption>Welcome back</Caption>
          <PageTitle>静かな再会</PageTitle>
        </header>

        {/* 1. Current Context */}
        <section className="space-y-6">
          <SectionTitle>今の文脈</SectionTitle>
          <Body className="text-muted-foreground/80">
            最近の行動から浮かび上がった、あなたの今の関心事です。
          </Body>
          <ContextProfileSection profile={contextProfile} />
        </section>

        {/* 2. Quiet Return */}
        {quietReturnItem && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
            <SectionTitle>静かな戻り</SectionTitle>
            <Body className="text-muted-foreground/80">
              かつてのあなたが残した意味に、もう一度出会ってみる。
            </Body>
            <MemoryCard memory={quietReturnItem} />
          </section>
        )}

        {/* 3. Recent Inbox */}
        {recentItems.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle>最近の余白</SectionTitle>
                <Body className="text-muted-foreground/80 mt-1">
                  直近で保存した記憶です。思考の入口として機能します。
                </Body>
              </div>
              <Link href="/inbox" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                すべて見る <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {recentItems.map((item) => (
                <MemoryCard key={item.id} memory={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
