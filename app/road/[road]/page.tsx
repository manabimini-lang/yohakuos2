import { RoadClient } from "@/components/road/road-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - ロードマップ",
  description: "今の自分に必要な導線と小さな実践",
};

export default function RoadPage({ params }: { params: { road: string } }) {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <RoadClient roadKey={params.road} />
    </div>
  );
}
