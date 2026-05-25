"use client";

// ===================================================
// YOHAKU Companion — Chat UI
// ===================================================
//
// 「Chat UI」ではなく、“静かな対話空間”
//

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
}

interface CompanionState {
    conversationId: string;
    messages: Message[];
    isLoading: boolean;
    isSilent: boolean;
    quietQuestion: string | null;
    error: string | null;
}

export default function CompanionChat() {
    const [state, setState] = useState<CompanionState>({
        conversationId: "",
        messages: [],
        isLoading: true,
        isSilent: false,
        quietQuestion: null,
        error: null,
    });
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load session on mount
    useEffect(() => {
        loadSession();
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [state.messages]);

    const loadSession = async () => {
        try {
            const res = await fetch("/api/companion/sessions");
            const data = await res.json();

            if (data.conversationId) {
                // Load messages for this conversation
                const msgRes = await fetch(
                    `/api/companion/messages?conversationId=${data.conversationId}`
                );
                const msgData = await msgRes.json();

                setState((prev) => ({
                    ...prev,
                    conversationId: data.conversationId,
                    messages: msgData.messages || [],
                    isLoading: false,
                }));
            } else {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        } catch (err) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "セッションの読み込みに失敗しました",
            }));
        }
    };

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || !state.conversationId) return;

        setInput("");

        // Add user message optimistically
        const userMsg: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: trimmed,
            createdAt: new Date().toISOString(),
        };

        setState((prev) => ({
            ...prev,
            messages: [...prev.messages, userMsg],
            isLoading: true,
            error: null,
        }));

        try {
            const res = await fetch("/api/companion/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: state.conversationId,
                    message: trimmed,
                }),
            });

            const data = await res.json();

            if (data.isSilent) {
                // AI chose silence — show nothing or quiet question
                setState((prev) => ({
                    ...prev,
                    isSilent: true,
                    quietQuestion: data.quietQuestion || null,
                    isLoading: false,
                }));
            } else {
                // Add AI response
                const aiMsg: Message = {
                    id: `ai-${Date.now()}`,
                    role: "assistant",
                    content: data.content,
                    createdAt: new Date().toISOString(),
                };
                setState((prev) => ({
                    ...prev,
                    messages: [...prev.messages, aiMsg],
                    isSilent: false,
                    quietQuestion: null,
                    isLoading: false,
                }));
            }
        } catch {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "応答の生成に失敗しました。もう一度お試しください。",
            }));
        }
    }, [input, state.conversationId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (state.isLoading && state.messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400 text-sm">準備中...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">静かな対話</h2>
                <p className="text-sm text-gray-400 mt-1">
                    考えたいことがあれば、そのまま書いてみてください
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {state.messages.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-sm">
                            ここは静かな対話の場所です。
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            何か考えていることや感じていることを、そのまま書いてみてください。
                        </p>
                    </div>
                )}

                {state.messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.role === "user"
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-50 text-gray-700 border border-gray-100"
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Silence indicator */}
                {state.isSilent && (
                    <div className="text-center py-2">
                        <p className="text-gray-300 text-xs">...</p>
                        {state.quietQuestion && (
                            <p className="text-gray-400 text-sm mt-1 italic">
                                {state.quietQuestion}
                            </p>
                        )}
                    </div>
                )}

                {/* Loading */}
                {state.isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {state.error && (
                <div className="px-6 py-2">
                    <p className="text-red-400 text-xs text-center">{state.error}</p>
                </div>
            )}

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-end space-x-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="何か考えていることはありますか？"
                        rows={1}
                        className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 placeholder-gray-300"
                        disabled={state.isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={state.isLoading || !input.trim()}
                        className="px-4 py-2.5 bg-gray-800 text-white rounded-2xl text-sm hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
}