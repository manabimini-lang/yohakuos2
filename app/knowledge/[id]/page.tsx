import { KnowledgeDetailClient } from "@/components/knowledge/knowledge-detail-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YOHAKU - 小さな実践を読む",
  description: "みんなの実践から、少しずつ学ぶ",
};

export default function KnowledgeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <KnowledgeDetailClient id={params.id} />
    </div>
  );
}
