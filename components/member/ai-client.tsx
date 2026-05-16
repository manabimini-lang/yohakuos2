"use client";

import { useState } from "react";
import { generateAiResponseAction } from "@/lib/actions/ai/generate-response";

export function AiClient({ isPaidMember, hasKey }: { isPaidMember: boolean; hasKey: boolean }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isPaidMember) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-2xl">
        <h2 className="text-lg font-medium text-slate-900 mb-2">AIとの対話機能</h2>
        <p className="text-slate-600 text-sm mb-6">
          思考を整理するためのAIアシスタント機能は、有料会員向けのサービスです。
        </p>
        <a href="/member/settings" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          設定画面でプランを確認する
        </a>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-2xl">
        <h2 className="text-lg font-medium text-slate-900 mb-2">APIキーの登録が必要です</h2>
        <p className="text-slate-600 text-sm mb-6">
          この機能を利用するには、ご自身のGemini APIキーを設定していただく必要があります。
        </p>
        <a href="/member/settings" className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          設定画面を開く
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResponse(null);

    const result = await generateAiResponseAction(input);

    if (result.ok && result.data) {
      setResponse(result.data.response);
      setInput(""); // Clear input on success
    } else {
      setError(result.error ?? "エラーが発生しました。");
    }

    setIsGenerating(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-sm text-slate-600 leading-relaxed">
          今の状態、気になっていること、ただ言葉にしておきたいことを入力してください。<br/>
          YOHAKUが少しだけ、あなたの思考を整理するお手伝いをします。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="今日は少し疲れているかもしれない..."
          rows={5}
          disabled={isGenerating}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 focus:border-slate-400 focus:outline-none disabled:opacity-50"
        />
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? "YOHAKUが考えています..." : "言葉を預ける"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {response}
          </p>
        </div>
      )}
    </div>
  );
}
