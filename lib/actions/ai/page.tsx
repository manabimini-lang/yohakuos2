import { auth } from "@/lib/auth";
import { generateYohaku } from "@/lib/ai/yohaku-generator";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    // 未認証ユーザーのハンドリング（例: ログインページへリダイレクト）
    return <div className="text-center py-20">ログインしてください</div>;
  }

  // Server ComponentでYohakuデータを生成
  const yohakuData = await generateYohaku(session.user.id);

  return <DashboardClient initialYohakuData={yohakuData} />;
}