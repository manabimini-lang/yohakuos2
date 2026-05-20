import { ProfileClient } from "@/components/profile/profile-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - プロフィール",
  description: "現在のロードや振り返りの履歴、各種設定",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-100 flex items-center justify-center">
      <ProfileClient />
    </div>
  );
}
