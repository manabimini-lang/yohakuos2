"use client";

// ===================================================
// YOHAKU Companion — Weekly Reflection Client
// ===================================================
//
// 週次振り返りを生成・表示するクライアントコンポーネント
// 「レポート化しすぎない」を意識
//

import { useState } from "react";

export default function WeeklyReflectionClient() {
    const [reflection, setReflection] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const generateReflection = async () => {
        setIsLoading(true);
        setHasGenerated(true);

        try {
            const res = await fetch("/api/companion/weekly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();

            if (data.content) {
                setReflection(data.content);
            } else if (data.error) {
                setReflection(
                    "今週の振り返りを生成できませんでした。また後で試してみてください。"
                );
            }
        } catch {
            setReflection(
                "今週の振り返りを生成できませんでした。また後で試してみてください。"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {!hasGenerated && (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-sm mb-6">
                        1週間の記録を基に、静かな振り返りを生成します。
                        <br />
                        レポートではなく、会話として捉えてください。
                    </p>
                    <button
                        onClick={generateReflection}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gray-800 text-white rounded-2xl text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                        {isLoading ? "生成中..." : "今週を振り返る"}
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="text-center py-8">
                    <div className="flex justify-center space-x-1 mb-4">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <p className="text-gray-400 text-xs">振り返りを準備中...</p>
                </div>
            )}

            {reflection && !isLoading && (
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl px-6 py-5 border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {reflection}
                        </p>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={generateReflection}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-500 border border-gray-200 rounded-xl text-xs hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            もう一度生成
                        </button>
                    </div>

                    <p className="text-center text-gray-300 text-xs">
                        この振り返りは参考です。ご自身の感覚が最も大切です。
                    </p>
                </div>
            )}
        </div>
    );
}