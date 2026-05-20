import dynamic from "next/dynamic";
import { Metadata } from "next";

const ReviewClient = dynamic(
  () => import("@/components/review/review-client").then((mod) => mod.ReviewClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400 font-mono tracking-widest animate-pulse">
          データを読み込んでいます...
        </p>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "YOHAKU - 振り返り",
  description: "過去の思考や感情の波を静かに振り返ります",
};

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <ReviewClient />
    </div>
  );
}
