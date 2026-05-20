"use client";

import { useState, useEffect } from "react";
import { GeminiStatusIndicator } from "@/components/member/gemini-status-indicator";
// Use server proxy for AI calls
import { getCurrentRoad } from "@/lib/utils/log-db";

const DEFAULT_ROADS = [
  { slug: "beginner", title: "初任者ロード", description: "教育現場で働く初任者教員としての文脈を理解してください。" },
  { slug: "side-hustle", title: "副業ロード", description: "本業と副業を両立する文脈を理解してください。" },
  { slug: "resignation", title: "退職ロード", description: "退職やキャリア転換の不安を理解してください。" },
];

type Message = {
  id: string;
  role: "user" | "ai";
  content: string; // User input
  originalContent?: string; // Stored user input for AI message
  aiResponse?: {
    summary: string;
    insight: string;
    nextStep: string;
  };
  isGeneratingShare?: boolean;
  isSharing?: boolean;
  sharePreview?: {
    title: string;
    summary: string;
    tags: string[];
  };
};

export function AiOrganizeClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentRoad, setCurrentRoad] = useState<string>("beginner");
  const [isOffline, setIsOffline] = useState(false);
  const [roads, setRoads] = useState<any[]>(DEFAULT_ROADS);

  const handleGenerateShare = async (msgId: string, originalContent: string) => {
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, isGeneratingShare: true } : m));

    const shareSystemPrompt = `あなたはYOHAKU共有整理AIです。

目的：
個人ログを、他者が参考にできる「知見」に変換する。

制約：
- 個人情報を除去
- 固有名詞禁止
- 感情の生ログ禁止
- 一般化する
- 2〜3行
- 優しく簡潔に

出力形式：
title:
summary:
tags:`;

    try {
      const response = await fetch("/api/ai/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: originalContent,
          systemPrompt: shareSystemPrompt,
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("unauthorized");
        }
        throw new Error("API Error");
      }

      const resData = await response.json();
      const outputText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let title = "";
      let summary = "";
      let tags: string[] = [];

      const lines = outputText.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().startsWith("title:")) {
          title = line.replace(/title:/i, "").trim();
        } else if (line.toLowerCase().startsWith("summary:")) {
          summary = line.replace(/summary:/i, "").trim();
        } else if (line.toLowerCase().startsWith("tags:")) {
          tags = line.replace(/tags:/i, "").trim().split(/[,，\s]+/).map((t: string) => t.replace(/^#/, "").trim()).filter(Boolean);
        }
      }

      setMessages((prev) => prev.map(m => m.id === msgId ? { 
        ...m, 
        isGeneratingShare: false,
        sharePreview: { title, summary, tags }
      } : m));
    } catch (e: any) {
      console.error(e);
      if (e.message === "unauthorized") {
        setToastMessage("Geminiに接続されていません。設定画面から接続してください。");
      } else {
        setToastMessage("知見の生成に失敗しました。");
      }
      setTimeout(() => setToastMessage(null), 3000);
      setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, isGeneratingShare: false } : m));
    }
  };

  useEffect(() => {
    const targetLog = sessionStorage.getItem("yohaku_ai_target_log");
    if (targetLog) {
      setInput(targetLog);
      sessionStorage.removeItem("yohaku_ai_target_log");
    }
    
    getCurrentRoad().then(setCurrentRoad);
    loadRoads();

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => {
        setIsOffline(false);
        loadRoads();
      };
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const loadRoads = async () => {
    try {
      const res = await fetch("/api/roads");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setRoads(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch roads:", e);
    }
  };

  const matchedRoad = roads.find(r => r.slug === currentRoad) || DEFAULT_ROADS[0];
  const promptContext = matchedRoad.roadPrompt?.systemPrompt
    ? matchedRoad.roadPrompt.systemPrompt
    : `${matchedRoad.title}としての文脈（${matchedRoad.description}）を理解してください。`;

  const roadData = {
    title: matchedRoad.title,
    context: promptContext
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    if (isOffline) {
      setToastMessage("オフライン時はAI整理を利用できません");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    setIsProcessing(true);

    try {
      const response = await fetch("/api/ai/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          roadContext: roadData.context,
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("unauthorized");
        } else if (response.status === 403) {
          throw new Error("forbidden");
        }
        throw new Error("API Error");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let summary = "";
      let insight = "";
      let nextStep = "";

      const summaryMatch = text.match(/## 状態整理\n([\s\S]*?)(?=## 気づき|## 小さな次の一歩|$)/);
      const insightMatch = text.match(/## 気づき\n([\s\S]*?)(?=## 小さな次の一歩|$)/);
      const nextStepMatch = text.match(/## 小さな次の一歩\n([\s\S]*?)$/);

      if (summaryMatch) summary = summaryMatch[1].trim();
      if (insightMatch) insight = insightMatch[1].trim();
      if (nextStepMatch) nextStep = nextStepMatch[1].trim();

      if (!summary && !insight && !nextStep) {
        summary = text.trim();
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "",
        originalContent: input.trim(),
        aiResponse: { summary, insight, nextStep },
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (e: any) {
      if (e.message === "unauthorized") {
        setToastMessage("Geminiに接続されていません。設定画面から接続してください。");
      } else if (e.message === "forbidden") {
        setToastMessage("この機能は有料会員限定です。");
      } else {
        setToastMessage("Geminiへ接続できませんでした");
      }
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-24 space-y-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-rose-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-slate-800 tracking-wider">AI整理</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {roadData.title}
            </span>
            {isOffline && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 animate-pulse font-sans">
                オフラインモード
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">記録を整理し、小さな気づきを見つけます</p>
        </div>
        <GeminiStatusIndicator />
      </div>

      {/* Chat History */}
      <div className="space-y-16">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {msg.role === "user" ? (
              <div className="pl-4 border-l-2 border-slate-200">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.content}
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 md:p-8 space-y-8">
                <div className="space-y-3">
                  <h3 className="text-xs font-medium tracking-widest text-slate-400 uppercase">状態整理</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {msg.aiResponse?.summary}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-medium tracking-widest text-slate-400 uppercase">気づき</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {msg.aiResponse?.insight}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-medium tracking-widest text-slate-400 uppercase">次の一歩</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {msg.aiResponse?.nextStep}
                  </p>
                </div>
                
                {/* Share Section */}
                <div className="pt-6 border-t border-slate-100/60 flex flex-col items-center gap-6">
                  {!msg.sharePreview && !msg.isGeneratingShare && (
                    <button
                      onClick={() => handleGenerateShare(msg.id, msg.originalContent || "")}
                      className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-slate-400"
                    >
                      [ この気づきを共有する ]
                    </button>
                  )}
                  
                  {msg.isGeneratingShare && (
                    <div className="animate-pulse text-sm text-slate-400">
                      共有知見を抽出しています...
                    </div>
                  )}

                  {msg.sharePreview && (
                    <div className="w-full rounded-xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">共有プレビュー</span>
                        <h4 className="text-base font-medium text-slate-800">{msg.sharePreview.title}</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {msg.sharePreview.summary}
                      </p>
                      {msg.sharePreview.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {msg.sharePreview.tags.map((tag, i) => (
                            <span key={i} className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sharePreview: undefined } : m))}
                          disabled={msg.isSharing}
                          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                          [ キャンセル ]
                        </button>
                        <button
                          onClick={async () => {
                            if (msg.isSharing) return;
                            
                            // Prevent double submission by setting isSharing true
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isSharing: true } : m));
                            setToastMessage("共有を送信中...");
                            
                            try {
                              const roadTitle = roadData.title || "未設定";
                              
                              // 1. Save to YOHAKU Database (Supabase)
                              const dbRes = await fetch("/api/knowledge/create", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  title: msg.sharePreview!.title,
                                  summary: msg.sharePreview!.summary,
                                  tags: msg.sharePreview!.tags,
                                  road: roadTitle,
                                })
                              });

                              if (!dbRes.ok) throw new Error("Database save failed");

                              // 2. Post to Discord
                              const discordRes = await fetch("/api/discord/share", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  title: msg.sharePreview!.title,
                                  summary: msg.sharePreview!.summary,
                                  tags: msg.sharePreview!.tags,
                                  road: roadTitle,
                                })
                              });
                              
                              if (!discordRes.ok) throw new Error("Discord share failed");
                              
                              setToastMessage("知見を共有しました");
                              setTimeout(() => setToastMessage(null), 3000);
                              
                              // Clear the preview after successful share
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sharePreview: undefined, isSharing: false } : m));
                            } catch (e) {
                              setToastMessage("共有に失敗しました");
                              setTimeout(() => setToastMessage(null), 3000);
                              // Reset sharing state on error
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isSharing: false } : m));
                            }
                          }}
                          disabled={msg.isSharing}
                          className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:bg-indigo-600 shadow-sm disabled:opacity-50"
                        >
                          {msg.isSharing ? "送信中..." : "Discordへ共有"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="animate-pulse pl-4 border-l-2 border-slate-200">
            <p className="text-slate-400 text-sm">YOHAKUが静かに整理しています...</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="pt-8 border-t border-slate-100">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isOffline ? "オフラインモードではAI整理を利用できません" : "今の状態を書いてみる"}
          rows={4}
          disabled={isProcessing || isOffline}
          className="w-full resize-none rounded-2xl border-none bg-slate-50/50 p-6 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-200 transition-colors disabled:opacity-60"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim() || isOffline}
            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isProcessing ? "整理中..." : "整理する"}
          </button>
        </div>
      </div>
    </div>
  );
}
