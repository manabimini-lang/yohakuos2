"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { YuiConversation, YuiMemoryCandidate } from "@/app/ui/backend/yui/models";

type YuiChatProps = {
  conversations: YuiConversation[];
  memoryCandidates: YuiMemoryCandidate[];
  onSend: (content: string) => Promise<{
    conversation: YuiConversation;
    memoryCandidate: YuiMemoryCandidate | null;
  }>;
  onApproveCandidate: (candidateId: string) => Promise<void>;
  onRejectCandidate: (candidateId: string) => Promise<void>;
};

export function YuiChat({
  conversations,
  memoryCandidates,
  onSend,
  onApproveCandidate,
  onRejectCandidate,
}: YuiChatProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = content.trim();
    if (!message) return;

    setIsSending(true);
    setActionError(null);
    try {
      await onSend(message);
      setContent("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "会話の保存に失敗しました");
    } finally {
      setIsSending(false);
    }
  };

  const handleApprove = async (candidateId: string) => {
    setBusyCandidateId(candidateId);
    setActionError(null);
    try {
      await onApproveCandidate(candidateId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "記憶化に失敗しました");
    } finally {
      setBusyCandidateId(null);
    }
  };

  const handleReject = async (candidateId: string) => {
    setBusyCandidateId(candidateId);
    setActionError(null);
    try {
      await onRejectCandidate(candidateId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "却下に失敗しました");
    } finally {
      setBusyCandidateId(null);
    }
  };

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conversation</p>
        <h2 className="mt-1 text-lg font-semibold">YUI との会話</h2>
      </div>

      <div className="max-h-[22rem] space-y-3 overflow-auto pr-1">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            まだ会話はありません。最初のメッセージを送ると履歴が保存されます。
          </p>
        ) : (
          conversations.map((message) => (
            <div
              key={message.id}
              className={`rounded-2xl border p-4 text-sm leading-7 ${
                message.role === "user"
                  ? "ml-8 border-border bg-muted/30"
                  : "mr-8 border-border/80 bg-background"
              }`}
            >
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {message.role}
              </div>
              <p className="whitespace-pre-wrap text-foreground/90">{message.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="YUI に話しかける..."
          rows={4}
          className="yohaku-input resize-none"
        />
        <button type="submit" disabled={isSending} className="yohaku-btn">
          {isSending ? "送信中..." : "保存して送る"}
        </button>
      </form>

      {actionError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {actionError}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">YUI</p>
            <h3 className="mt-1 text-sm font-medium">これは今後の会話で参考にしますか？</h3>
          </div>
          <span className="yohaku-tag">memory candidates</span>
        </div>

        {memoryCandidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            まだ候補はありません。会話の中で大事な情報が見つかると、ここに出てきます。
          </p>
        ) : (
          <div className="space-y-3">
            {memoryCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium">{candidate.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidate.status === "pending" ? "保留中" : candidate.status}
                    </p>
                  </div>
                  <span className="yohaku-tag">importance {candidate.importance}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{candidate.summary}</p>
                <p className="mt-2 text-sm leading-7 text-foreground/90">{candidate.reason}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyCandidateId === candidate.id}
                    onClick={() => handleApprove(candidate.id)}
                    className="yohaku-btn"
                  >
                    {busyCandidateId === candidate.id ? "処理中..." : "覚えておく"}
                  </button>
                  <button
                    type="button"
                    disabled={busyCandidateId === candidate.id}
                    onClick={() => handleReject(candidate.id)}
                    className="yohaku-btn-ghost"
                  >
                    今回は保存しない
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
