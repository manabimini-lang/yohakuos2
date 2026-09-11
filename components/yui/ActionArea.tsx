"use client";
import { useState } from "react";

type Action = {
  id: string;
  title: string;
  description?: string;
  kind?: string;
  reason?: string;
};

type Props = {
  actions: Action[];
  onCreateRecommendation?: () => void;
};

export default function ActionArea({ actions = [], onCreateRecommendation }: Props) {
  const [executing, setExecuting] = useState(false);
  const [openReasons, setOpenReasons] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [pendingDismiss, setPendingDismiss] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sendFeedback = async (actionId: string, feedback: "helpful" | "dismissed", dismissReason?: "busy" | "not_relevant" | "later") => {
    try {
      const response = await fetch("/api/yui/unified-actions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, feedback, dismissReason }),
      });
      if (!response.ok) throw new Error("feedback failed");
      setFeedbackMessage(feedback === "helpful" ? "役に立ったという反応を保存しました。" : "見送りを保存しました。");
    } catch {
      setFeedbackMessage("保存できませんでした。もう一度お試しください。");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">YUIからの提案</p>
          <h3 className="text-lg font-bold">次にできそうなこと</h3>
        </div>
        <div>
          <button
            onClick={async () => {
              setExecuting(true);
              try {
                await (onCreateRecommendation?.() ?? Promise.resolve());
              } finally {
                setExecuting(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
          >
            {executing ? "作成中..." : "提案を作る"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {feedbackMessage ? <p className="text-xs text-muted-foreground" role="status">{feedbackMessage}</p> : null}
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">提案はまだありません。『提案を作る』を押してみてください。</p>
        ) : (
          actions.slice(0, 3).filter((a) => !dismissed[a.id]).map((a, index) => (
            <div key={a.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.description ? <p className="mt-1 text-sm text-muted-foreground">{a.description}</p> : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">{a.kind ?? "提案"}</span>
                  {a.reason ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenReasons((current) => ({
                          ...current,
                          [a.id]: !current[a.id],
                        }))
                      }
                      className="text-xs font-semibold text-primary"
                    >
                      {openReasons[a.id] ? "理由を閉じる" : "この提案の理由"}
                    </button>
                  ) : null}
                </div>
              </div>
              {openReasons[a.id] && a.reason ? (
                <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-xs leading-6 text-foreground/90">この提案を出した理由：{a.reason}</p>
              ) : null}
              <div className="mt-3 flex justify-end">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => void sendFeedback(a.id, "helpful")} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">役に立った</button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDismiss((current) => (current === a.id ? null : a.id));
                    }}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    今回は見送る
                  </button>
                </div>
              </div>
              {pendingDismiss === a.id ? (
                <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-medium text-foreground">見送る理由を教えてください（任意）</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {([
                      ["busy", "今は忙しい"],
                      ["not_relevant", "自分には合わない"],
                      ["later", "後で見たい"],
                    ] as const).map(([reason, label]) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setDismissed((current) => ({ ...current, [a.id]: true }));
                          setPendingDismiss(null);
                          void sendFeedback(a.id, "dismissed", reason);
                        }}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setDismissed((current) => ({ ...current, [a.id]: true }));
                        setPendingDismiss(null);
                        void sendFeedback(a.id, "dismissed");
                      }}
                      className="rounded-full px-3 py-1.5 text-xs text-muted-foreground underline underline-offset-4"
                    >
                      理由を選ばず見送る
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
        {actions.length > 0 && actions.every((a) => dismissed[a.id]) ? (
          <p className="text-sm text-muted-foreground">今回はすべて見送りました。必要になったら「提案を作る」から再表示できます。</p>
        ) : null}
      </div>
    </div>
  );
}
