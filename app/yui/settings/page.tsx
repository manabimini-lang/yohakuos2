import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YuiConnectionsSettings } from "@/components/yui/YuiConnectionsSettings";
import { YuiNotificationSettingsForm } from "@/components/yui/YuiNotificationSettingsForm";
import { YuiNotificationPreviewCard } from "@/components/yui/YuiNotificationPreviewCard";

export const metadata: Metadata = {
  title: "YUI Settings",
  description: "YUI Connections & Notifications の設定",
};

export const dynamic = "force-dynamic";

export default async function YuiSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?redirect=/yui/settings");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,1))] pb-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">YUI Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">外部連携と通知の設定</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            YUIに接続する外部サービスと、秘書からの連絡・リマインドの受け取り設定を管理します。
          </p>
        </header>

        <YuiConnectionsSettings />
        <YuiNotificationSettingsForm />
        <YuiNotificationPreviewCard />
      </div>
    </main>
  );
}
