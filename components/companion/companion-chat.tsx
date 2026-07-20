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
    const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
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

    const sendMessage = useCallback(async (overrideText?: string) => {
        const trimmed = (overrideText ?? input).trim();
        if (!trimmed || !state.conversationId) return;

        setLastFailedInput(null);
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
            setLastFailedInput(trimmed);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "companion_failed",
            }));
        }
    }, [input, state.conversationId]);

    const handleRetryConnection = useCallback(() => {
        if (!lastFailedInput) return;
        const textToResend = lastFailedInput;
        setLastFailedInput(null);
        setState((prev) => ({ ...prev, error: null }));
        sendMessage(textToResend);
    }, [lastFailedInput, sendMessage]);

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
        <div className="flex flex-col h-full max-w-2xl mx-auto pb-24 md:pb-24">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-background">
                <h2 className="text-lg font-light text-foreground">静かな対話</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    言葉をひとつずつ置いておく場所です。
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
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                    ? "bg-white/10 text-foreground"
                                    : "bg-card text-foreground border border-border"
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
                    <div className="text-muted-foreground text-sm italic">少し静かに考えています…</div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {state.error && (
                <div className="px-6 py-3">
                    <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-3">
                        <p className="text-sm text-muted-foreground font-light leading-relaxed">
                            現在の会話を続けられませんでした。
                        </p>
                        <p className="text-xs text-muted-foreground font-light">
                            少し時間を空けて、もう一度お試しください。
                        </p>
                        {lastFailedInput && (
                            <button
                                onClick={handleRetryConnection}
                                className="inline-flex items-center text-xs font-light text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                再接続
                                <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-100 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="flex items-end space-x-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="そのまま、ここに置いてください"
                        rows={1}
                        className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 placeholder:text-muted-foreground"
                        disabled={state.isLoading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={state.isLoading || !input.trim()}
                        className="px-4 py-2.5 rounded-2xl bg-white/10 text-sm text-foreground transition-colors hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
}
