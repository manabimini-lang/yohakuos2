import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YuiConnectionsSettings } from "@/components/yui/YuiConnectionsSettings";

export const metadata: Metadata = {
  title: "YUI Settings",
  description: "YUI Connections の設定",
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
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">YUI Connections</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">外部サービス接続</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            ここでは、どのサービスを YUI に接続するか、現在の接続状態、許可する情報の範囲だけを管理します。
            OAuth や外部データ取得はまだ行いません。
          </p>
        </header>

        <YuiConnectionsSettings />
      </div>
    </main>
  );
}
