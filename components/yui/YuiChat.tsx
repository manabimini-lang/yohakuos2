"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { YuiConversation, YuiGoal, YuiMemoryCandidate } from "@/app/ui/backend/yui/models";

type YuiChatProps = {
  conversations: YuiConversation[];
  memoryCandidates: YuiMemoryCandidate[];
  onSend: (content: string, goalId?: string) => Promise<unknown>;
  onApproveCandidate: (candidateId: string) => Promise<void>;
  onRejectCandidate: (candidateId: string) => Promise<void>;
  onChangeConversationGoal?: (conversationId: string, goalId: string | null) => Promise<void>;
  goals?: YuiGoal[];
  currentGoalId?: string | null;
  composerRequest?: { id: number; value: string };
  composerRef?: RefObject<HTMLTextAreaElement>;
};

export function YuiChat({
  conversations,
  memoryCandidates,
  onSend,
  onApproveCandidate,
  onRejectCandidate,
  onChangeConversationGoal,
  goals = [],
  currentGoalId = null,
  composerRequest,
  composerRef,
}: YuiChatProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [contextOverride, setContextOverride] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const keepComposerVisible = () => {
      if (document.activeElement !== composerRef?.current) return;
      window.requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ block: "end", inline: "nearest" });
      });
    };

    viewport.addEventListener("resize", keepComposerVisible);
    viewport.addEventListener("scroll", keepComposerVisible);
    return () => {
      viewport.removeEventListener("resize", keepComposerVisible);
      viewport.removeEventListener("scroll", keepComposerVisible);
    };
  }, [composerRef]);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => fetch("/api/ai/status", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); const data = await response.json(); setAiStatus(data.configured ? "ready" : "missing"); })
      .catch(() => { if (!controller.signal.aborted) setAiStatus("error"); });
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); };
  }, []);
  const draft = content;

  useEffect(() => {
    if (composerRequest) {
      setContent(composerRequest.value);
    }
  }, [composerRequest]);

  const setDraft = (value: string) => {
    setContent(value);
  };

  const visibleMemoryCandidates = memoryCandidates.slice(0, 3);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending || aiStatus !== "ready") return;

    setIsSending(true);
    setActionError(null);
    try {
      await onSend(message, contextOverride || undefined);
      setDraft("");
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
    <Card className="p-4 space-y-3 sm:p-6 sm:space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">YUIに相談</p>
        <h2 className="mt-1 text-lg font-semibold">今日は何を進めたいですか？</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          気になることを一文で。YUIが次の一歩を提案します。予定は確認後に登録します。
        </p>
      </div>

      <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">相談の入力例を見る</summary><div className="flex flex-wrap gap-2 py-1">
        {[
          "明日の予定を整理して",
          "新しい目的を追加して",
          "予定を金曜に移して",
          "今週の振り返りをして"
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setDraft(s)}
            className="rounded-full bg-slate-100/80 hover:bg-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition"
          >
            「{s}」
          </button>
        ))}
      </div></details>

      {aiStatus !== "ready" ? <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
        <p>{aiStatus === "loading" ? "AIの設定を確認しています…" : aiStatus === "error" ? "AIの設定を確認できませんでした。設定画面で確認してください。" : "AI相談が未接続です。無料プランではGeminiまたはGroqのAPIキーを設定してください。Premiumはキー不要です。"}</p>
        <Link href="/yui/settings#ai" className="mt-2 inline-block underline">AIを設定する</Link>
        <p className="mt-2">メモはAIなしで残せます。右下の「＋」→「メモを保存」を選んでください。</p>
      </div> : null}
      <form ref={formRef} onSubmit={handleSubmit} className="scroll-mb-4 space-y-3">
        <details><summary className="cursor-pointer text-xs text-muted-foreground">記録先を変更（通常は自動判定）</summary><label className="block space-y-1">
          <span className="text-[11px] text-slate-500">記録先（変更しなければYUIが自動判定）</span>
          <select value={contextOverride} onChange={(event) => setContextOverride(event.target.value)} className="yohaku-input py-2 text-sm" aria-label="会話の記録先">
            <option value="">YUIに任せる</option>
            {goals.filter((goal) => goal.status === "active").map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}{goal.id === currentGoalId ? "（現在の目的）" : ""}</option>
            ))}
          </select>
        </label></details>
        <textarea
          ref={composerRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="例: 明日の予定を整理して"
          rows={4}
          className="yohaku-input resize-none !text-base"
          onFocus={() => {
            window.setTimeout(() => {
              formRef.current?.scrollIntoView({ block: "end", inline: "nearest" });
            }, 120);
          }}
        />
        <button type="submit" disabled={isSending || aiStatus !== "ready" || !draft.trim()} className="yohaku-btn mr-16">
          {isSending ? "送信中..." : "YUIに相談する"}
        </button>
      </form>

      <details className="rounded-2xl border border-border/80 bg-muted/10 p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-muted-foreground">
          会話の履歴を開く（{conversations.length}件）
        </summary>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          これまでの相談内容と、それぞれの記録先を確認・変更できます。
        </p>
        <div className="mt-3 max-h-[16rem] space-y-3 overflow-auto pr-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              まだ会話はありません。最初のメッセージを送ると履歴が保存されます。
            </p>
          ) : (
            conversations.map((message) => {
              const speaker = message.role === "user" ? "あなた" : "YUI";

              return (
                <div
                  key={message.id}
                  className={`rounded-2xl border p-4 text-sm leading-7 ${
                    message.role === "user"
                      ? "ml-8 border-border bg-muted/30"
                      : "mr-8 border-border/80 bg-background"
                  }`}
                >
                  <div className="mb-2 text-xs tracking-[0.2em] text-muted-foreground">
                    {speaker}
                  </div>
                  <p className="mb-2 text-[11px] text-slate-500">
                    記録先: {message.goal_id ? (goals.find((goal) => goal.id === message.goal_id)?.title ?? "目的") : "目的なし"}
                    {message.goal_id && message.goal_association_source === "auto" ? "（YUIが自動判定）" : message.goal_id ? "（確認済み）" : ""}
                  </p>
                  <select
                    value={message.goal_id ?? ""}
                    onChange={async (event) => {
                      if (!onChangeConversationGoal) return;
                      setEditingConversationId(message.id);
                      try { await onChangeConversationGoal(message.id, event.target.value || null); } finally { setEditingConversationId(null); }
                    }}
                    disabled={editingConversationId === message.id || !onChangeConversationGoal}
                    className="mb-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500"
                    aria-label={`${speaker}の記録先を変更`}
                  >
                    <option value="">目的なし</option>
                    {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                  </select>
                  <p className="line-clamp-3 whitespace-pre-wrap text-foreground/90">{message.content}</p>
                </div>
              );
            })
          )}
        </div>
      </details>

      {actionError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {actionError}
        </div>
      )}

      <details className="rounded-2xl border border-border/80 bg-muted/10 p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-muted-foreground">
          会話からの記憶候補を確認する（{memoryCandidates.length}件）
        </summary>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          今後の提案に使う情報だけを選べます。選ばなくても、相談内容は履歴として残ります。
        </p>

        {memoryCandidates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            まだ候補はありません。会話の中で大事な情報が見つかると、ここに出てきます。
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {visibleMemoryCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium">{candidate.summary || candidate.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidate.status === "pending" ? "保留中の記憶候補" : candidate.status}
                      {candidate.goal_id ? ` · 記録先: ${goals.find((goal) => goal.id === candidate.goal_id)?.title ?? "目的"}` : " · 目的なし"}
                    </p>
                  </div>
                  <span className="yohaku-tag">参考にする候補</span>
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
                    {busyCandidateId === candidate.id ? "処理中..." : "今後の提案に使う"}
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
            {memoryCandidates.length > visibleMemoryCandidates.length ? (
              <p className="text-xs text-muted-foreground">
                ほか{memoryCandidates.length - visibleMemoryCandidates.length}件の候補は、重要度を整理してから表示します。
              </p>
            ) : null}
          </div>
        )}
      </details>
    </Card>
  );
}
