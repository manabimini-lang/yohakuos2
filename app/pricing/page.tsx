import { PricingClient } from "@/components/pricing/pricing-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - 参加プラン",
  description: "YOHAKU Premium 参加プランのご案内",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 selection:bg-slate-100 flex items-center justify-center">
      <PricingClient />
    </div>
  );
}
