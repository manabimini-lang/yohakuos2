import { KnowledgeClient } from "@/components/knowledge/knowledge-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YOHAKU - 小さな実践",
  description: "みんなの実践から、少しずつ学ぶ",
};

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <KnowledgeClient />
    </div>
  );
}
