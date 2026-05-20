"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, PenLine, MessageSquare } from "lucide-react";

const MESSAGES = [
  "焦らなくて大丈夫。",
  "少し休んでもいい。",
  "今日できることを、1つだけ。",
  "ここに戻ってこれただけで十分です。",
  "深呼吸して、少しだけ整えましょう。",
  "書けない日があっても、また来れます。"
];

export function YohakuHomeClient({ 
  lastLog 
}: { 
  lastLog?: { id: string; inputText: string; aiResponse: string | null; createdAt: Date } | null 
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [input, setInput] = useState("");
  const [discordFeed, setDiscordFeed] = useState<{ id: string; author: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("yohaku_onboarding_completed");
    if (!onboardingCompleted) {
      router.push("/onboarding");
      return;
    }

    // Pick a random message
    const randomMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setMessage(randomMessage);

    // Fetch Discord feed
    async function fetchFeed() {
      try {
        const res = await fetch("/api/discord/feed");
        if (res.ok) {
          const data = await res.json();
          setDiscordFeed(data);
        }
      } catch (err) {
        console.error("Failed to fetch Discord feed", err);
      }
    }
    fetchFeed();
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Optional: store the drafted input in sessionStorage or pass via query to AI page
    sessionStorage.setItem("yohaku_draft_input", input);
    router.push("/member/ai");
  };

  const dateFmt = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-xl pb-24 pt-4 md:pt-12 space-y-16 animate-in fade-in duration-1000">
      
      {/* セクション1｜今日の余白 */}
      <section className="text-center space-y-4 px-4">
        <h1 className="text-2xl md:text-3xl font-medium text-slate-800 tracking-wide leading-relaxed">
          {message}
        </h1>
        <p className="text-sm text-slate-400">
          {dateFmt.format(new Date())}
        </p>
      </section>

      {/* セクション2｜今日の入力導線 */}
      <section className="px-4">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-slate-50 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm transition-shadow hover:shadow-sm">
            <h2 className="mb-4 text-base font-medium text-slate-700 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-slate-400" />
              今日はどんな感じですか？
            </h2>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="少し疲れている、頭が整理できない..."
              className="w-full resize-none border-0 bg-transparent p-0 text-slate-800 placeholder:text-slate-300 focus:ring-0 text-base md:text-lg leading-relaxed outline-none"
              rows={3}
            />
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900"
              >
                整理してみる
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* セクション3｜続きから */}
      {lastLog && (
        <section className="px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500">前回の記録</h2>
            <span className="text-xs text-slate-400">{dateFmt.format(new Date(lastLog.createdAt))}</span>
          </div>
          
          <Link href="/member/ai/history" className="block">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-colors hover:border-slate-200">
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                {lastLog.inputText}
              </p>
              
              {lastLog.aiResponse && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                  <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                    {/* Assuming AI response has "### 小さな一歩" which we can try to extract, 
                        or just show the whole response truncated */}
                    {lastLog.aiResponse.split("### 小さな一歩")[1]?.replace(/#/g, '').trim() || lastLog.aiResponse.replace(/#/g, '').trim()}
                  </p>
                </div>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* Discord Feed Section */}
      {discordFeed.length > 0 && (
        <section className="px-4 space-y-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <MessageSquare className="w-4 h-4" />
            <h2 className="text-sm font-semibold tracking-wide">同じ空間の小さな実践</h2>
          </div>
          <div className="space-y-3.5">
            {discordFeed.map((post) => (
              <div 
                key={post.id} 
                className="rounded-3xl border border-slate-100 bg-white p-5 md:p-6 space-y-2.5 shadow-sm"
              >
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-medium text-slate-500">@{post.author}</span>
                  <span className="font-mono">
                    {new Date(post.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} {new Date(post.created_at).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* セクション4｜静かな振り返り導線 */}
      <section className="px-4 text-center">
        <Link 
          href="/member/ai/history"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors py-4"
        >
          <span>少しずつ積み上がっています</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

    </div>
  );
}
