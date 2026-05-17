"use client";

import { useState, useRef, useEffect } from "react";
import { generateAiResponseAction } from "@/lib/actions/ai/generate-response";
import { Loader2, ArrowUp } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import sanitizeHtml from "sanitize-html";

const EMOTION_TAGS = [
  "疲れた",
  "焦る",
  "不安",
  "整えたい",
  "少し前進したい"
];

export function AiChatClient({ 
  hasKey, 
  hasActiveSub 
}: { 
  hasKey: boolean; 
  hasActiveSub: boolean;
}) {
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [smallAction, setSmallAction] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setSmallAction(null);
    setIsSaved(false);

    // moodTagはサーバーアクションの引数として渡す（テキストに結合しない）
    const result = await generateAiResponseAction(input, selectedTag || undefined);

    if (!result.ok) {
      setError(result.error || "少し時間を置いて、もう一度試してみてください。");
    } else {
      setResponse(result.data?.response || null);
      setSmallAction(result.data?.smallAction || null);
      setInput("");
      setSelectedTag(null);
      setIsSaved(true);
    }
    setLoading(false);
  };

  if (!hasActiveSub) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/50 p-10 text-center max-w-2xl mx-auto shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-medium text-slate-900 mb-3">
          静かな思考整理の空間
        </h2>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-8">
          <p>
            YOHAKU AIは、あなたの思考整理を支えるための会員向け機能です。
          </p>
          <p>
            少し疲れた日にも、安心して戻ってこられる場所を目指しています。
          </p>
        </div>
        <Link 
          href="/member/settings"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          会員プランを見る
        </Link>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/50 p-10 text-center max-w-2xl mx-auto shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-medium text-slate-900 mb-3">
          最初に、自分専用AIの接続を行います。
        </h2>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          あなただけのAPIキーを設定して、静かな振り返り空間を作りましょう。
        </p>
        <Link 
          href="/member/settings"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          設定画面でキーを登録する
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-32">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">今の状態に近いものはありますか？</p>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedTag === tag 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-3xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="例：今日は少し疲れている、頭が整理できない..."
            className="min-h-[120px] max-h-[300px] w-full resize-none border-0 bg-transparent p-4 text-sm leading-relaxed focus-visible:ring-0 outline-none text-slate-800"
            disabled={loading}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between px-4 pb-3 pt-2">
            <span className="text-xs text-slate-400">
              {input.length > 0 ? "Ctrl + Enter で送信" : ""}
            </span>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-5 border border-rose-100 text-center animate-in fade-in">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* メインの整理カード */}
          <div className="rounded-3xl bg-slate-50 border border-slate-100 p-7 shadow-sm">
            <div className="prose prose-sm prose-slate max-w-none
              prose-headings:font-medium prose-headings:text-slate-700 prose-headings:text-sm
              prose-headings:mt-6 prose-headings:mb-2.5 first:prose-headings:mt-0
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-sm
              prose-p:my-2">
              <ReactMarkdown
                components={{
                  // 「小さな一歩」のセクションは非表示にし、別カードに分離
                  h3: ({ children }) => {
                    const text = String(children);
                    if (text === "小さな一歩") return null;
                    return <h3>{children}</h3>;
                  },
                }}
              >
                {sanitizeHtml(response.split("### 小さな一歩")[0])}
              </ReactMarkdown>
            </div>
          </div>

          {/* 小さな一歩：別カード */}
          {smallAction && (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
              <p className="text-xs font-medium text-emerald-600 mb-2">今日の小さな一歩</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {smallAction}
              </p>
            </div>
          )}

          {/* 保存メッセージ（静か・インライン） */}
          {isSaved && (
            <div className="flex items-center justify-between pt-1 px-1">
              <p className="text-xs text-slate-400">記録しました。あとで振り返れます。</p>
              <Link
                href="/member/ai/history"
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-4"
              >
                記録を見る
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
