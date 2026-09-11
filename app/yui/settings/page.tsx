import type { Metadata } from "next";
import { requireSession } from "@/core/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { YuiConnectionsSettings } from "@/components/yui/YuiConnectionsSettings";
import { YuiNotificationSettingsForm } from "@/components/yui/YuiNotificationSettingsForm";
import { YuiNotificationPreviewCard } from "@/components/yui/YuiNotificationPreviewCard";
import { YuiAiSettingsCard } from "@/components/yui/YuiAiSettingsCard";
import { YuiHealthDashboard } from "@/components/yui/YuiHealthDashboard";
import { YuiProfileSettingsForm } from "@/components/yui/YuiProfileSettingsForm";
import Link from "next/link";
import { YuiAiUsageCard } from "@/components/yui/YuiAiUsageCard";
import { YuiPlanSummaryCard } from "@/components/yui/YuiPlanSummaryCard";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { YuiSettingsHeaderActions } from "@/components/yui/YuiSettingsHeaderActions";

export const metadata: Metadata = {
  title: "YUIの設定",
  description: "YUIの外部連携・AI・通知を設定します",
};

export const dynamic = "force-dynamic";

export default async function YuiSettingsPage() {
  const session = await requireSession("/login?redirect=/yui/settings");

  if (!session) {
    redirect("/login?redirect=/yui/settings");
  }

  let aiSettings = null;
  let settingsLoadError: string | null = null;
  let accountPlan: { plan: string | null; role: string | null } | null = null;
  let savedApiKeys: Array<{ apiProvider: string }> = [];
  try {
    [aiSettings, accountPlan, savedApiKeys] = await Promise.all([
      prisma.userAISettings.findUnique({ where: { userId: session.id } }),
      prisma.user.findUnique({ where: { id: session.id }, select: { plan: true, role: true } }),
      prisma.userApiKey.findMany({ where: { userId: session.id }, select: { apiProvider: true } }),
    ]);
  } catch (error) {
    console.error("Failed to load YUI AI settings", error);
    settingsLoadError = "一部の設定を読み込めませんでした。接続を確認してからもう一度お試しください。";
  }

  const isPremium = hasPremiumAccess(accountPlan?.plan, accountPlan?.role);
  const provider = isPremium
    ? aiSettings?.provider === "byok_groq" ? "groq" : aiSettings?.provider === "byok_gemini" ? "gemini" : "managed"
    : aiSettings?.provider === "groq" ? "groq" : "gemini";
  const legacyProvider = aiSettings?.provider === "groq" || aiSettings?.provider === "byok_groq" ? "groq" : "gemini";
  const hasGeminiKey = savedApiKeys.some((key) => key.apiProvider === "gemini")
    || Boolean(aiSettings?.encryptedApiKey && legacyProvider === "gemini");
  const hasGroqKey = savedApiKeys.some((key) => key.apiProvider === "groq")
    || Boolean(aiSettings?.encryptedApiKey && legacyProvider === "groq");
  const initialAiSettings = {
    provider,
    hasKey: provider === "groq" ? hasGroqKey : provider === "gemini" ? hasGeminiKey : false,
    availableKeys: { gemini: hasGeminiKey, groq: hasGroqKey },
    model: aiSettings?.model || "gemini-2.5-flash",
    isEnabled: aiSettings?.isEnabled ?? isPremium,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,1))] pb-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">YUIの設定</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">外部連携・AI・通知の設定</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            YUIで使う外部サービス、AI相談、朝晩のまとめを設定できます。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/pricing" className="inline-flex w-fit items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
              有料プランを見る（Stripe決済）
            </Link>
            <YuiSettingsHeaderActions />
          </div>
        </header>

        {settingsLoadError ? (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {settingsLoadError}
          </div>
        ) : null}

        <YuiHealthDashboard />
        <YuiAiUsageCard />
        <YuiPlanSummaryCard isPremium={isPremium} />
        <section id="profile" className="scroll-mt-6"><YuiProfileSettingsForm /></section>
        <section id="connections" className="scroll-mt-6"><YuiConnectionsSettings /></section>
        <section id="ai" className="scroll-mt-6"><YuiAiSettingsCard initialSettings={initialAiSettings} isPremium={isPremium} /></section>
        <section id="notifications" className="scroll-mt-6"><YuiNotificationSettingsForm isPremium={isPremium} /></section>
        <YuiNotificationPreviewCard isPremium={isPremium} />
      </div>
    </main>
  );
}
