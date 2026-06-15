import { auth } from "@/lib/auth";
import { generateYohaku } from "@/lib/ai/yohaku-generator";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Server ComponentでReflectionデータを生成
  const yohakuData = await generateYohaku(session.user.id);

  return <DashboardClient initialYohakuData={yohakuData} />;
}