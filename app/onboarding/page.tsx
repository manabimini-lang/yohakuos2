import { OnboardingClient } from "@/components/onboarding/onboarding-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - はじめる",
  description: "YOHAKUの初期設定と最初の一歩",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-100 flex items-center justify-center">
      <OnboardingClient />
    </div>
  );
}
