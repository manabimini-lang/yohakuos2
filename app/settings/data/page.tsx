import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DataSettingsClient } from "@/components/settings/data-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - データ管理",
  description: "個人ログデータのエクスポートと管理",
};

export default async function DataSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-100 flex items-center justify-center">
      <DataSettingsClient />
    </div>
  );
}
