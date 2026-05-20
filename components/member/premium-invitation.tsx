"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, PenLine, MessageSquare, Route } from "lucide-react";

export function PremiumInvitation() {
  const router = useRouter();

  return (
    <div className="w-full max-w-xl mx-auto py-12 md:py-16 text-center space-y-10 selection:bg-slate-100">
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-150 text-slate-400">
        <Sparkles className="w-5 h-5 stroke-[1.5]" />
      </div>

      {/* Main Copy */}
      <div className="space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-serif text-slate-800 tracking-wide">
          AI整理はPremium機能です
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          YOHAKU AIで、日々のログを整理できます。散らばった思考をつなぎ合わせ、進むべき歩みを少しだけ見えやすくする空間です。
        </p>
      </div>

      {/* Premium Value Props - Thin borders & quiet details */}
      <div className="border border-slate-100 rounded-2xl bg-white p-6 text-left max-w-sm mx-auto space-y-4">
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-50 pb-2">
          Premium でできること
        </p>
        <ul className="space-y-3.5 text-xs text-slate-650">
          <li className="flex items-start space-x-3">
            <PenLine className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>絡まった日々のライフログをAIが優しく整理</span>
          </li>
          <li className="flex items-start space-x-3">
            <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>小さな実践をDiscordコミュニティへ匿名共有</span>
          </li>
          <li className="flex items-start space-x-3">
            <Route className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>各ロードに応じた個別のおすすめ教材や推薦知見の表示</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <div className="pt-2">
        <button
          onClick={() => router.push("/pricing")}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2.5 transition-colors text-sm shadow-sm group"
        >
          <span>Premiumへ参加</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
