import { LogClient } from "@/components/log/log-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YOHAKU - 思考ログ",
  description: "自分だけの思考ログをローカルに記録します",
};

export default function LogPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-100">
      <LogClient />
    </div>
  );
}
