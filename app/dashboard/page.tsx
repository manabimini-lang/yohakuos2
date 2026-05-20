import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YOHAKU - ダッシュボード",
  description: "開いてすぐ書ける、静かなOS",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <DashboardClient />
    </div>
  );
}
