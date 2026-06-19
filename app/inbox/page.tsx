import { buildContextProfile } from "@/lib/memory/context-profile";
import { getContextMemories } from "@/lib/memory/context-memory";
import { ContextProfileSection } from "@/components/memory/ContextProfileSection";
import { ContextMemoriesSection } from "@/components/memory/ContextMemoriesSection";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InboxClient } from "@/components/capture/inbox-client";
import { EmptyInbox } from "@/components/capture/EmptyInbox";
import { PageTitle, Body, Caption, SectionTitle } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const contentItemSelect = {
    id: true,
    title: true,
    url: true,
    type: true,
    thumbnailUrl: true,
    fileUrl: true,
    fileName: true,
    domain: true,
    reflection: true,
    aiTags: true,
    theme: true,
    createdAt: true,
    metadata: true,
    meaningStatus: true,
    summary: true,
  } as const;

  // Priority 3: Fetch Recent Items (sorted by createdAt, limit 12)
  const recentItems = await prisma.contentItem.findMany({
    where: { userId },
    select: contentItemSelect,
    orderBy: { createdAt: "desc" },
    take: 12,
  }) as any[];

  // Priority 3: Fetch Context Items (sorted by contextScore, limit 12)
  const contextItems = await prisma.contentItem.findMany({
    where: { userId },
    select: contentItemSelect,
    orderBy: { contextScore: "desc" },
    take: 12,
  }) as any[];

  const [userSettings, starterJourney, user] = await Promise.all([
    prisma.userAISettings.findUnique({
      where: { userId },
    }),
    getStarterJourneyStatus(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true },
    }),
  ]);

  const contextProfile = await buildContextProfile(userId);
  const contextMemories = contextProfile && contextProfile.themes.length > 0
    ? await getContextMemories(userId, contextProfile.themes)
    : [];

  const today = new Date().toLocaleDateString("ja-JP", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  const hasAiAccess = userSettings?.isEnabled || starterJourney.active;
  const showHiddenFeatures = recentItems.length >= 5 && hasAiAccess;
  const isDiscordConnected = !!user?.discordId;

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground/80">
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-24">
        <header className="space-y-4 pb-10 border-b border-border">
          <Caption>{today}</Caption>
          <div className="space-y-2">
            <PageTitle>Inbox</PageTitle>
            <Body className="max-w-2xl">
              ここは静かに戻ってくるための余白です。残したいものをひとつずつ置いて、夜に少しだけ開いてみてください。
            </Body>
          </div>
        </header>

        <div className="mt-8">
          <ContextProfileSection profile={contextProfile} />
          {contextMemories.length > 0 && (
            <ContextMemoriesSection memories={contextMemories} />
          )}
        </div>

        <Card className="mt-8 p-6 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground/55">
                <MessageSquare className="h-4 w-4" />
                <Caption>Discord Connection</Caption>
              </div>
              <SectionTitle>
                {isDiscordConnected ? "Discord同期中" : "コミュニティとのつながりを整える"}
              </SectionTitle>
              <Body className="max-w-2xl">
                {isDiscordConnected 
                  ? "あなたの記録は静かに同期されています。連携は設定からいつでも解除可能です。"
                  : "Discordを連携すると、小さな実践の共有やコミュニティの声を静かに受け取れます。"}
              </Body>
            </div>
            <Link href="/settings/account" tabIndex={-1}>
              <Button variant={isDiscordConnected ? "outline" : "ghost"} className="gap-2">
                {isDiscordConnected ? "設定を確認" : "Discordを設定する"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        <section className="mt-10">
          <InboxClient recentItems={recentItems} contextItems={contextItems} />
        </section>

        {showHiddenFeatures && (
          <section className="mt-24 pt-16 border-t border-border/50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
            <Caption className="text-foreground/40">
              今日の余白
            </Caption>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quiet Return */}
              <Link 
                href="/quiet-return"
                className="group p-8 rounded-2xl bg-card border border-border/50 hover:bg-white/[0.04] transition-colors flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <SectionTitle className="text-lg text-foreground/80">静かな戻り</SectionTitle>
                  <Body className="text-foreground/40">
                    以前の記録に、<br />もう一度出会ってみる。
                  </Body>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-foreground/40 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Learning */}
              <Link 
                href="/learning"
                className="group p-8 rounded-2xl bg-card border border-border/50 hover:bg-white/[0.04] transition-colors flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <SectionTitle className="text-lg text-foreground/80">今日の学び</SectionTitle>
                  <Body className="text-foreground/40">
                    保存した記録から、<br />ゆっくり学びを振り返る。
                  </Body>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-foreground/40 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Ritual */}
              <Link 
                href="/ritual"
                className="group p-8 rounded-2xl bg-card border border-border/50 hover:bg-white/[0.04] transition-colors flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <SectionTitle className="text-lg text-foreground/80">小さな儀式</SectionTitle>
                  <Body className="text-foreground/40">
                    考える前に、<br />少しだけ整える。
                  </Body>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-foreground/40 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
