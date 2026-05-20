import { AiOrganizeClient } from "@/components/ai/ai-organize-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YOHAKU - AI整理",
  description: "記録を整理し、小さな気づきを見つけます",
};

export default function AiPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <AiOrganizeClient />
    </div>
  );
}
