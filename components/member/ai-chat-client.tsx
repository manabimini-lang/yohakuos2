"use client";

import { useState, useRef, useEffect } from "react";
import { generateAiResponseAction } from "@/lib/actions/ai/generate-response";
import { Loader2, ArrowUp, Sparkles, ExternalLink, X, CheckCircle2 } from "lucide-react";
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

  // Local state for the new AI Connection experience
  const [localConnected, setLocalConnected] = useState(hasKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize connection state from localStorage on mount (hydration-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yohaku_ai_connection");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.connected && parsed?.provider === "gemini") {
          setLocalConnected(true);
        }
      } else if (hasKey) {
        localStorage.setItem("yohaku_ai_connection", JSON.stringify({ provider: "gemini", connected: true }));
      }
    } catch (e) {
      console.error("Failed to read connection from localStorage:", e);
    }
  }, [hasKey]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      localStorage.setItem("yohaku_ai_connection", JSON.stringify({ provider: "gemini", connected: true }));
      window.dispatchEvent(new Event("yohaku_ai_connection_changed"));
    } catch (err) {
      console.error("Failed to save connection to localStorage:", err);
    }

    setLocalConnected(true);
    isModalOpen && setIsModalOpen(false);
    showToast("Geminiを接続しました");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setSmallAction(null);
    setIsSaved(false);

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
      <div className="rounded-2xl border border-slate-100 bg-white/50 p-10 text-center max-w-2xl mx-auto shadow-sm backdrop-blur-sm dark:border-slate-800/40 dark:bg-slate-900/10">
        <h2 className="text-lg font-medium text-foreground dark:text-foreground mb-3">
          静かな思考整理の空間
        </h2>
        <div className="space-y-4 text-sm text-slate-600 dark:text-muted-foreground leading-relaxed mb-8">
          <p>
            YOHAKU AIは、あなたの思考整理を支えるための会員向け機能です。
          </p>
          <p>
            少し疲れた日にも、安心して戻ってこられる場所を目指しています。
          </p>
        </div>
        <Link 
          href="/yui/settings"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-foreground"
        >
          会員プランを見る
        </Link>
      </div>
    );
  }

  // New AI Connection Experience View
  if (!localConnected) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
        <div className="space-y-2">
          <h1 className="text-xl font-medium text-foreground dark:text-slate-50 tracking-tight">AI接続</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground font-light">
            YOHAKUで利用するAIを接続します
          </p>
        </div>

        {/* Gemini Card */}
        <div className="rounded-2xl border border-slate-100 bg-white dark:border-slate-800/60 dark:bg-slate-900/45 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all">
          <div className="flex items-center gap-4">
            {/* Gemini glowing logo风 icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-400 p-0.5 shadow-md shadow-indigo-100 dark:shadow-none shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-200" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm text-foreground dark:text-foreground">Google Gemini</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-slate-50 border border-slate-100 dark:text-muted-foreground dark:bg-slate-950 dark:border-slate-800 px-2 py-0.5 rounded-full">
                  未接続
                </span>
              </div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground font-normal leading-relaxed">
                Googleアカウントで利用するAIです
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-foreground dark:text-foreground px-5 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Geminiを接続
          </button>
        </div>

        {/* Connect Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200 flex flex-col gap-6">
              
              {/* Modal Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-slate-600 dark:hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground dark:text-slate-50">Google Geminiを接続</h2>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed font-light">
                  YOHAKUでGeminiを利用するには、Google AI Studioで接続設定を行います。
                </p>
              </div>

              {/* Modal Steps */}
              <div className="space-y-4">
                {/* STEP 1 */}
                <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">STEP 1</span>
                    <span className="text-xs font-medium text-foreground dark:text-foreground">Google AI Studioを開く</span>
                  </div>
                  <div className="pt-1">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 dark:text-muted-foreground dark:bg-slate-800 dark:border-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium"
                    >
                      Google AI Studioを開く
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {/* STEP 2 */}
                <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">STEP 2</span>
                    <span className="text-xs font-medium text-foreground dark:text-foreground">APIキーを作成</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-light leading-relaxed pl-1">
                    「Create API key」ボタンをクリックして、新しくAPIキーを生成します。
                  </p>
                </div>

                {/* STEP 3 */}
                <form onSubmit={handleConnect} className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">STEP 3</span>
                    <span className="text-xs font-medium text-foreground dark:text-foreground">YOHAKUへ貼り付け</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIza..."
                      className="w-full text-xs font-mono rounded-lg border border-slate-250 bg-white dark:border-slate-700 dark:bg-slate-850 px-3.5 py-2.5 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!apiKeyInput.trim()}
                      className="w-full inline-flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-foreground dark:text-foreground py-2.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      接続する
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-950 dark:bg-slate-900 text-foreground dark:text-foreground px-5 py-3.5 rounded-full shadow-xl flex items-center gap-2.5 border border-slate-900 dark:border-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-32">
      {/* Gemini Connected Status Card */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/40 dark:bg-emerald-950/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-400 p-0.5 shadow-md shadow-indigo-50 dark:shadow-none shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-indigo-200" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-xs text-foreground dark:text-foreground">Google Gemini</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100/50 dark:border-emerald-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                接続済み
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-light">
              Googleアカウントで利用するAIが接続されています
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-foreground dark:text-foreground border border-slate-200/85 dark:border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          再接続
        </button>
      </div>

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
                    ? "bg-slate-900 text-foreground border-slate-900" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="例：今日は少し疲れている、頭が整理できない..."
            className="min-h-[120px] max-h-[300px] w-full resize-none border-0 bg-transparent p-4 text-sm leading-relaxed focus-visible:ring-0 outline-none text-foreground"
            disabled={loading}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between px-4 pb-3 pt-2">
            <span className="text-xs text-muted-foreground">
              {input.length > 0 ? "Ctrl + Enter で送信" : ""}
            </span>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 shadow-sm">
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
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
              <p className="text-xs font-medium text-emerald-600 mb-2">今日の小さな一歩</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {smallAction}
              </p>
            </div>
          )}

          {/* 保存メッセージ（静か・インライン） */}
          {isSaved && (
            <div className="flex items-center justify-between pt-1 px-1">
              <p className="text-xs text-muted-foreground">記録しました。あとで振り返れます。</p>
              <Link
                href="/member/ai/history"
                className="text-xs text-muted-foreground hover:text-slate-700 transition-colors underline underline-offset-4"
              >
                記録を見る
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            
            {/* Modal Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-slate-600 dark:hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground dark:text-slate-50">Google Geminiを接続</h2>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed font-light">
                YOHAKUでGeminiを利用するには、Google AI Studioで接続設定を行います。
              </p>
            </div>

            {/* Modal Steps */}
            <div className="space-y-4">
              {/* STEP 1 */}
              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">STEP 1</span>
                  <span className="text-xs font-medium text-foreground dark:text-foreground">Google AI Studioを開く</span>
                </div>
                <div className="pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 dark:text-muted-foreground dark:bg-slate-800 dark:border-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium"
                  >
                    Google AI Studioを開く
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">STEP 2</span>
                  <span className="text-xs font-medium text-foreground dark:text-foreground">APIキーを作成</span>
                </div>
                <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-light leading-relaxed pl-1">
                  「Create API key」ボタンをクリックして、新しくAPIキーを生成します。
                </p>
              </div>

              {/* STEP 3 */}
              <form onSubmit={handleConnect} className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">STEP 3</span>
                  <span className="text-xs font-medium text-foreground dark:text-foreground">YOHAKUへ貼り付け</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIza..."
                    className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-850 px-3.5 py-2.5 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!apiKeyInput.trim()}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-foreground dark:text-foreground py-2.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    接続する
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-950 dark:bg-slate-900 text-foreground dark:text-foreground px-5 py-3.5 rounded-full shadow-xl flex items-center gap-2.5 border border-slate-900 dark:border-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
